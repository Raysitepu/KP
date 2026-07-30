import "server-only";

import { selectWeatherForecastByArrivalTime } from "@/lib/bmkg/forecast-selector";
import { getCachedWeatherWithMetadata } from "@/lib/bmkg/weather-service";
import { findRegionByCoordinate } from "@/lib/regions/coordinate-region-service";
import { sampleRoutePoints } from "@/lib/routing/route-sampler";
import type {
  AdministrativeRegion,
  RouteGeometry,
  RouteWeatherPoint,
  RouteWeatherResponse,
  SampledRoutePoint,
} from "@/types/route";
import type { WeatherResponse } from "@/types/weather";
import { classifyWeatherRisk } from "./risk-classifier";
import {
  buildRouteWeatherSummary,
  uniqueAdm4Codes,
} from "./route-weather-summary";

type ResolvedSample = SampledRoutePoint & {
  region: AdministrativeRegion | null;
};

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

function deduplicateSameRegions(points: ResolvedSample[]) {
  const seen = new Set<string>();
  const lastIndex = points.length - 1;
  return points
    .filter((point, index) => {
      if (!point.region) return true;
      if (index === 0 || index === lastIndex) {
        seen.add(point.region.adm4);
        return true;
      }
      if (seen.has(point.region.adm4)) return false;
      seen.add(point.region.adm4);
      return true;
    })
    .map((point, index) => ({
      ...point,
      id: `route-point-${index + 1}`,
      index,
    }));
}

export async function buildRouteWeather(input: {
  geometry: RouteGeometry;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  departureTime: string;
}): Promise<RouteWeatherResponse> {
  const samples = sampleRoutePoints(
    input.geometry,
    input.totalDistanceMeters,
    input.totalDurationSeconds,
    input.departureTime,
  );
  const resolved = await mapWithConcurrency(samples, 5, async (sample) => ({
    ...sample,
    region: await findRegionByCoordinate(sample),
  }));
  const points = deduplicateSameRegions(resolved);
  const uniqueAdm4 = uniqueAdm4Codes(points);
  const weatherEntries = await mapWithConcurrency(
    uniqueAdm4,
    5,
    async (adm4) => {
      try {
        const value = await getCachedWeatherWithMetadata(adm4);
        return [adm4, value] as const;
      } catch (error) {
        console.error(
          "Cuaca titik rute gagal:",
          adm4,
          error instanceof Error ? error.message : "unknown",
        );
        return [adm4, null] as const;
      }
    },
  );
  const weatherByAdm4 = new Map<
    string,
    { weather: WeatherResponse; stale: boolean } | null
  >(weatherEntries);

  const weatherPoints: RouteWeatherPoint[] = points.map((point) => {
    const cached = point.region ? weatherByAdm4.get(point.region.adm4) : null;
    const selection = cached
      ? selectWeatherForecastByArrivalTime(
          cached.weather,
          new Date(point.estimatedArrivalTime),
        )
      : { status: "unavailable" as const, forecast: null };
    return {
      ...point,
      forecast: selection.forecast,
      forecastStatus: selection.status,
      status: classifyWeatherRisk(selection.forecast),
      staleCache: cached?.stale ?? false,
    };
  });
  const summary = buildRouteWeatherSummary(weatherPoints);
  const partial = summary.unavailablePointCount > 0;
  const hasRegion = weatherPoints.some((point) => point.region);
  const hasForecast = weatherPoints.some((point) => point.forecast);
  const message = !hasRegion
    ? "Polygon wilayah administratif belum tersedia untuk titik perjalanan ini. Rute tetap ditampilkan."
    : !hasForecast
      ? "Data prakiraan BMKG belum tersedia untuk waktu kedatangan tersebut. Rute tetap ditampilkan."
      : partial
        ? "Data cuaca pada beberapa titik belum dapat diambil. Rute tetap ditampilkan."
        : "Informasi cuaca sepanjang rute berhasil disiapkan berdasarkan prakiraan BMKG.";
  return {
    success: true,
    points: weatherPoints,
    summary,
    partial,
    message,
  };
}
