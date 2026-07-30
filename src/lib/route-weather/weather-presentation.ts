import type { RouteWeatherStatus } from "@/types/route";
import type { NormalizedForecast } from "@/types/weather";

export type WeatherMarkerPresentation = {
  symbol: string;
  label: string;
};

const statusFallback: Record<RouteWeatherStatus, WeatherMarkerPresentation> = {
  normal: { symbol: "☀", label: "Cuaca normal" },
  rain: { symbol: "🌦", label: "Hujan" },
  caution: { symbol: "🌧", label: "Cuaca perlu diperhatikan" },
  warning: { symbol: "⚡", label: "Cuaca buruk" },
  unknown: { symbol: "?", label: "Data tidak tersedia" },
};

export function weatherMarkerPresentation(
  forecast: NormalizedForecast | null,
  status: RouteWeatherStatus,
): WeatherMarkerPresentation {
  if (!forecast) return statusFallback.unknown;
  const description = forecast.weatherDescription.toLocaleLowerCase("id-ID");
  if (/petir|badai|puting beliung/.test(description))
    return { symbol: "⚡", label: "Hujan petir atau badai" };
  if (/hujan lebat/.test(description))
    return { symbol: "🌧", label: "Hujan lebat" };
  if (/hujan sedang/.test(description))
    return { symbol: "🌧", label: "Hujan sedang" };
  if (/hujan ringan|gerimis/.test(description))
    return { symbol: "🌦", label: "Hujan ringan" };
  if (/kabut|asap/.test(description))
    return { symbol: "≋", label: "Kabut atau jarak pandang rendah" };
  if (/cerah berawan/.test(description))
    return { symbol: "⛅", label: "Cerah berawan" };
  if (/berawan/.test(description)) return { symbol: "☁", label: "Berawan" };
  if (/cerah/.test(description)) return { symbol: "☀", label: "Cerah" };
  return statusFallback[status];
}
