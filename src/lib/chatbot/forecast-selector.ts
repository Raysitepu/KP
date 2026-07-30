import type { ParsedWeatherIntent, TimePeriod } from "@/types/chatbot";
import type { NormalizedForecast, WeatherResponse } from "@/types/weather";

const PERIOD_HOURS: Record<TimePeriod, [number, number]> = {
  dawn: [0, 5],
  morning: [6, 10],
  noon: [11, 14],
  afternoon: [15, 17],
  evening: [18, 23],
};

const TZ_LABELS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function timezoneLabel(timezone: string) {
  return TZ_LABELS[timezone] ?? timezone;
}

export function selectForecasts(
  weather: WeatherResponse,
  parsed: ParsedWeatherIntent,
  now = new Date(),
) {
  if (parsed.asksThreeDays) return weather.forecasts;
  const targetDate = addDays(
    localDate(now, weather.location.timezone),
    parsed.dayOffset,
  );
  let candidates = weather.forecasts.filter((item) => item.date === targetDate);
  if (parsed.period) {
    const [start, end] = PERIOD_HOURS[parsed.period];
    candidates = candidates.filter((item) => {
      const hour = Number(item.time.slice(0, 2));
      return hour >= start && hour <= end;
    });
  }
  if (
    parsed.dayOffset === 0 &&
    !parsed.period &&
    [
      "current_weather",
      "temperature",
      "humidity",
      "wind",
      "visibility",
      "cloud_cover",
    ].includes(parsed.intent)
  ) {
    const upcoming = candidates.find(
      (item) =>
        new Date(item.datetime).getTime() >= now.getTime() - 90 * 60_000,
    );
    return upcoming ? [upcoming] : candidates.slice(-1);
  }
  return candidates;
}

export function primaryForecast(items: NormalizedForecast[]) {
  return items[0] ?? null;
}
