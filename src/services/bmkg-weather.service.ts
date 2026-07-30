import { bmkgWeatherSchema, rawForecastSchema } from "@/schemas/bmkg";
import type { NormalizedForecast, WeatherResponse } from "@/types/weather";
import {
  flattenForecasts,
  groupForecasts,
  selectCurrentForecast,
} from "@/utils/weather";
import { fetchJson, ServiceError } from "./fetch-json";

const TIMEZONE_OFFSETS: Record<string, string> = {
  "Asia/Jakarta": "+07:00",
  "Asia/Makassar": "+08:00",
  "Asia/Jayapura": "+09:00",
};

function isoDatetime(value: string, offset: string) {
  const normalized = value.replace(" ", "T");
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}${offset}`;
}

export function normalizeWeather(
  raw: unknown,
  adm4: string,
  fetchedAt = new Date().toISOString(),
): WeatherResponse {
  const parsed = bmkgWeatherSchema.safeParse(raw);
  if (!parsed.success)
    throw new ServiceError("INVALID_DATA", "Struktur data cuaca tidak sesuai.");
  const l = parsed.data.lokasi;
  const timezone = l.timezone ?? "Asia/Jakarta";
  const offset = TIMEZONE_OFFSETS[timezone] ?? "+07:00";
  const forecasts = flattenForecasts(
    parsed.data.data.map((entry) => entry.cuaca),
  )
    .flatMap((value) => {
      const item = rawForecastSchema.safeParse(value);
      if (!item.success) return [];
      const d = item.data;
      const local = d.local_datetime;
      const utc = d.utc_datetime ? isoDatetime(d.utc_datetime, "+00:00") : null;
      const normalized: NormalizedForecast = {
        datetime: utc ?? isoDatetime(local, offset),
        localDatetime: local,
        utcDatetime: utc,
        date: local.slice(0, 10),
        time: local.slice(11, 16),
        temperature: d.t ?? null,
        humidity: d.hu ?? null,
        weatherDescription: d.weather_desc,
        weatherDescriptionEn: d.weather_desc_en ?? null,
        windSpeed: d.ws ?? null,
        windDirection: d.wd ?? null,
        cloudCover: d.tcc ?? null,
        visibility: d.vs_text ?? null,
        iconUrl: d.image?.startsWith("https://") ? d.image : null,
        analysisDate: d.analysis_date ?? null,
      };
      return [normalized];
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
  return {
    location: {
      province: l.provinsi ?? "Sumatera Utara",
      regency: l.kotkab ?? "-",
      district: l.kecamatan ?? "-",
      village: l.desa ?? "-",
      latitude: l.lat ?? null,
      longitude: l.lon ?? null,
      timezone,
      adm4: l.adm4 ?? adm4,
    },
    forecasts,
    grouped: groupForecasts(forecasts),
    current: selectCurrentForecast(forecasts),
    fetchedAt,
  };
}

export async function getWeather(
  adm4: string,
  retry = 0,
  fresh = false,
): Promise<WeatherResponse> {
  const base =
    process.env.BMKG_WEATHER_URL ??
    (process.env.BMKG_WEATHER_BASE_URL
      ? `${process.env.BMKG_WEATHER_BASE_URL.replace(/\/$/, "")}/publik/prakiraan-cuaca`
      : null) ??
    "https://api.bmkg.go.id/publik/prakiraan-cuaca";
  try {
    return normalizeWeather(
      await fetchJson(`${base}?adm4=${encodeURIComponent(adm4)}`, 10_000, {
        ...(fresh ? { cache: "no-store" as const } : {}),
        ...(!fresh ? { next: { revalidate: 1800 } } : {}),
      }),
      adm4,
    );
  } catch (error) {
    if (
      retry < 1 &&
      error instanceof ServiceError &&
      ["TIMEOUT", "NETWORK_ERROR", "UPSTREAM_ERROR"].includes(error.code)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return getWeather(adm4, retry + 1, fresh);
    }
    throw error;
  }
}
