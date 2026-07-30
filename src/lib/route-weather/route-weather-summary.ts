import type { RouteWeatherPoint, RouteWeatherSummary } from "@/types/route";
import { statusRank } from "./risk-classifier";

export function uniqueAdm4Codes(points: { region: { adm4: string } | null }[]) {
  return [
    ...new Set(
      points.flatMap((point) => (point.region ? [point.region.adm4] : [])),
    ),
  ];
}

function numericValues(
  points: RouteWeatherPoint[],
  key: "temperature" | "windSpeed",
) {
  return points.flatMap((point) => {
    const value = point.forecast?.[key];
    return value == null ? [] : [value];
  });
}

export function buildRouteWeatherSummary(
  points: RouteWeatherPoint[],
): RouteWeatherSummary {
  const rainPoints = points.filter((point) =>
    ["rain", "caution", "warning"].includes(point.status),
  );
  const temperatures = numericValues(points, "temperature");
  const winds = numericValues(points, "windSpeed");
  const worst = points.reduce<RouteWeatherPoint | null>((current, point) => {
    if (!point.forecast) return current;
    return !current || statusRank(point.status) > statusRank(current.status)
      ? point
      : current;
  }, null);
  return {
    rainPointCount: rainPoints.length,
    firstRainDistanceKm: rainPoints[0]?.distanceFromOriginKm ?? null,
    worstCondition: worst?.forecast?.weatherDescription ?? null,
    worstPointId: worst?.id ?? null,
    minimumTemperature: temperatures.length ? Math.min(...temperatures) : null,
    maximumTemperature: temperatures.length ? Math.max(...temperatures) : null,
    maximumWindSpeed: winds.length ? Math.max(...winds) : null,
    unavailablePointCount: points.filter(
      (point) => point.forecastStatus === "unavailable",
    ).length,
  };
}
