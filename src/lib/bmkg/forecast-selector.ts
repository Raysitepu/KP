import type { NormalizedForecast, WeatherResponse } from "@/types/weather";

export type ArrivalForecastSelection = {
  status: "available" | "unavailable";
  forecast: NormalizedForecast | null;
  differenceMinutes: number | null;
};

function instant(item: NormalizedForecast) {
  const value = item.utcDatetime ?? item.datetime;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function selectForecastByArrivalTime(
  forecasts: NormalizedForecast[],
  estimatedArrivalTime: Date,
  maximumDifferenceMinutes = 240,
): ArrivalForecastSelection {
  if (!forecasts.length || Number.isNaN(estimatedArrivalTime.getTime()))
    return { status: "unavailable", forecast: null, differenceMinutes: null };
  const dated = forecasts.flatMap((forecast) => {
    const date = instant(forecast);
    return date ? [{ forecast, date }] : [];
  });
  if (!dated.length)
    return { status: "unavailable", forecast: null, differenceMinutes: null };
  const closest = dated.reduce((best, candidate) =>
    Math.abs(candidate.date.getTime() - estimatedArrivalTime.getTime()) <
    Math.abs(best.date.getTime() - estimatedArrivalTime.getTime())
      ? candidate
      : best,
  );
  const differenceMinutes = Math.round(
    Math.abs(closest.date.getTime() - estimatedArrivalTime.getTime()) / 60_000,
  );
  if (differenceMinutes > maximumDifferenceMinutes)
    return { status: "unavailable", forecast: null, differenceMinutes };
  return {
    status: "available",
    forecast: closest.forecast,
    differenceMinutes,
  };
}

export function selectWeatherForecastByArrivalTime(
  weather: WeatherResponse,
  estimatedArrivalTime: Date,
) {
  return selectForecastByArrivalTime(weather.forecasts, estimatedArrivalTime);
}
