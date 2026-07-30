import { describe, expect, it } from "vitest";
import { selectForecastByArrivalTime } from "@/lib/bmkg/forecast-selector";
import { classifyWeatherRisk } from "@/lib/route-weather/risk-classifier";
import { buildRouteWeatherSummary } from "@/lib/route-weather/route-weather-summary";
import { sampleRoutePoints } from "@/lib/routing/route-sampler";
import type {
  AdministrativeRegion,
  RouteGeometry,
  RouteWeatherPoint,
} from "@/types/route";
import type { NormalizedForecast } from "@/types/weather";

describe("pipeline prakiraan sepanjang rute", () => {
  it("menghubungkan sampel, ETA, wilayah, prakiraan, risiko, dan ringkasan", () => {
    const departureTime = "2026-07-22T05:00:00.000Z";
    const geometry: RouteGeometry = {
      type: "LineString",
      coordinates: [
        [98.6722, 3.5952],
        [98.603, 3.415],
        [98.5089, 3.1947],
      ],
    };
    const sampled = sampleRoutePoints(geometry, 64_000, 3_600, departureTime);
    const region: AdministrativeRegion = {
      adm1: "12",
      adm2: "12.76",
      adm3: "12.76.01",
      adm4: "12.76.01.1001",
      provinceName: "Sumatera Utara",
      regencyName: "Kota Medan",
      districtName: "Medan Kota",
      villageName: "Pusat Pasar",
      timezone: "Asia/Jakarta",
      matchedBy: "polygon",
    };
    const forecasts: NormalizedForecast[] = [
      {
        datetime: "2026-07-22T05:00:00.000Z",
        utcDatetime: "2026-07-22T05:00:00.000Z",
        localDatetime: "2026-07-22T12:00:00+07:00",
        date: "2026-07-22",
        time: "12:00",
        temperature: 29,
        humidity: 82,
        weatherDescription: "Hujan Lebat",
        weatherDescriptionEn: "Heavy Rain",
        windSpeed: 12,
        windDirection: "SE",
        cloudCover: 90,
        visibility: "5 km",
        iconUrl: null,
        analysisDate: "2026-07-22T00:00:00.000Z",
      },
      {
        datetime: "2026-07-22T06:00:00.000Z",
        utcDatetime: "2026-07-22T06:00:00.000Z",
        localDatetime: "2026-07-22T13:00:00+07:00",
        date: "2026-07-22",
        time: "13:00",
        temperature: 30,
        humidity: 75,
        weatherDescription: "Cerah Berawan",
        weatherDescriptionEn: "Partly Cloudy",
        windSpeed: 8,
        windDirection: "E",
        cloudCover: 55,
        visibility: "> 10 km",
        iconUrl: null,
        analysisDate: "2026-07-22T00:00:00.000Z",
      },
    ];

    const points: RouteWeatherPoint[] = sampled.map((point) => {
      const selection = selectForecastByArrivalTime(
        forecasts,
        new Date(point.estimatedArrivalTime),
      );
      return {
        ...point,
        region,
        forecast: selection.forecast,
        forecastStatus: selection.status,
        status: classifyWeatherRisk(selection.forecast),
        staleCache: false,
      };
    });

    expect(points.length).toBeGreaterThan(2);
    expect(points[0].estimatedArrivalTime).toBe(departureTime);
    expect(points.some((point) => point.status === "warning")).toBe(true);
    expect(points.at(-1)?.forecast?.weatherDescription).toBe("Cerah Berawan");
    expect(buildRouteWeatherSummary(points)).toMatchObject({
      rainPointCount: 3,
      firstRainDistanceKm: 0,
      worstCondition: "Hujan Lebat",
      minimumTemperature: 29,
      maximumTemperature: 30,
      unavailablePointCount: 0,
    });
  });
});
