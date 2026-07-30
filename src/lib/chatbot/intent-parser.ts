import type {
  DayReference,
  ParsedWeatherIntent,
  TimePeriod,
  WeatherIntent,
} from "@/types/chatbot";
import { normalizeRegionName } from "@/lib/regions/normalizer";

function matches(text: string, pattern: RegExp) {
  return pattern.test(text);
}

export function parseWeatherIntent(message: string): ParsedWeatherIntent {
  const text = normalizeRegionName(message);
  let intent: WeatherIntent = "unknown";
  if (matches(text, /\b(bandingkan|perbandingan|dibanding|versus|vs)\b/))
    intent = "compare_locations";
  else if (matches(text, /\b(peringatan|warning|waspada|nowcast)\b/))
    intent = "weather_warning";
  else if (
    matches(
      text,
      /\b(aman|keluar|luar ruangan|aktivitas|kegiatan|bepergian|olahraga)\b/,
    )
  )
    intent = "outdoor_recommendation";
  else if (matches(text, /\b(hujan|gerimis|petir|payung)\b/))
    intent = "rain_forecast";
  else if (matches(text, /\b(suhu|temperatur|derajat|panas|dingin)\b/))
    intent = "temperature";
  else if (matches(text, /\b(kelembapan|lembap|humidity)\b/))
    intent = "humidity";
  else if (matches(text, /\b(angin|kencang|wind)\b/)) intent = "wind";
  else if (matches(text, /\b(jarak pandang|visibilitas|visibility)\b/))
    intent = "visibility";
  else if (matches(text, /\b(tutupan awan|awan|cloud cover)\b/))
    intent = "cloud_cover";
  else if (matches(text, /\b(besok|lusa|prakiraan|prediksi|ke depan)\b/))
    intent = "weather_forecast";
  else if (matches(text, /\b(cuaca|cerah|berawan|kondisi)\b/))
    intent = matches(text, /\b(sekarang|saat ini)\b/)
      ? "current_weather"
      : "weather_forecast";

  const day: DayReference = matches(text, /\blusa\b/)
    ? "day_after_tomorrow"
    : matches(text, /\bbesok\b/)
      ? "tomorrow"
      : "today";
  const dayOffset = day === "today" ? 0 : day === "tomorrow" ? 1 : 2;
  let period: TimePeriod | null = null;
  if (matches(text, /\bdini hari\b/)) period = "dawn";
  else if (matches(text, /\bpagi\b/)) period = "morning";
  else if (matches(text, /\bsiang\b/)) period = "noon";
  else if (matches(text, /\bsore\b/)) period = "afternoon";
  else if (matches(text, /\bmalam\b/)) period = "evening";

  return {
    intent,
    day,
    dayOffset,
    period,
    asksThreeDays: matches(text, /\b(tiga|3)\s+hari\b/),
    wantsDetail: matches(text, /\b(detail|lengkap|rinci)\b/),
    isDynamic: intent !== "unknown",
  };
}

export function extractComparisonParts(message: string) {
  const withoutCommand = message.replace(
    /\b(?:bandingkan|perbandingan|cuaca|prakiraan)\b/gi,
    " ",
  );
  const parts = withoutCommand
    .split(/\s+(?:dan|dengan|versus|vs|dibandingkan dengan)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? [parts[0], parts[1]] : null;
}
