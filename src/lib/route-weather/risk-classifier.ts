import type { RouteWeatherStatus } from "@/types/route";
import type { NormalizedForecast } from "@/types/weather";

function visibilityKm(value: string | null) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

export function classifyWeatherRisk(
  forecast: NormalizedForecast | null,
): RouteWeatherStatus {
  if (!forecast) return "unknown";
  const description = forecast.weatherDescription.toLocaleLowerCase("id-ID");
  if (/hujan lebat|petir|badai|puting beliung/.test(description))
    return "warning";
  const visibility = visibilityKm(forecast.visibility);
  if (
    /hujan sedang/.test(description) ||
    (forecast.windSpeed != null && forecast.windSpeed >= 30) ||
    (visibility != null && visibility < 5)
  )
    return "caution";
  if (/hujan|gerimis/.test(description)) return "rain";
  return "normal";
}

export function statusRank(status: RouteWeatherStatus) {
  return { unknown: 0, normal: 1, rain: 2, caution: 3, warning: 4 }[status];
}
