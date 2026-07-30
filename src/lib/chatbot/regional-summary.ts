import type {
  ParsedWeatherIntent,
  RegionalWeatherSample,
  RegionalWeatherSummary,
} from "@/types/chatbot";
import type { RegionCandidate } from "@/types/regions";
import type { NormalizedForecast } from "@/types/weather";

type RegionalForecastEntry = {
  region: RegionCandidate;
  forecasts: NormalizedForecast[];
};

const periodLabels = {
  dawn: "dini hari",
  morning: "pagi",
  noon: "siang",
  afternoon: "sore",
  evening: "malam",
} as const;

function contextLabel(parsed: ParsedWeatherIntent) {
  if (parsed.asksThreeDays) return "untuk tiga hari ke depan";
  const day =
    parsed.day === "tomorrow"
      ? "besok"
      : parsed.day === "day_after_tomorrow"
        ? "lusa"
        : "hari ini";
  return parsed.period ? `${day} ${periodLabels[parsed.period]}` : day;
}

function numericValues(
  forecasts: NormalizedForecast[],
  key: "temperature" | "windSpeed",
) {
  return forecasts.flatMap((forecast) => {
    const value = forecast[key];
    return value == null ? [] : [value];
  });
}

function sample(entry: RegionalForecastEntry): RegionalWeatherSample {
  const temperatures = numericValues(entry.forecasts, "temperature");
  const winds = numericValues(entry.forecasts, "windSpeed");
  const conditions = [
    ...new Set(entry.forecasts.map((item) => item.weatherDescription)),
  ];
  return {
    adm4: entry.region.adm4,
    districtName: entry.region.districtName,
    villageName: entry.region.villageName,
    conditions,
    minimumTemperature: temperatures.length ? Math.min(...temperatures) : null,
    maximumTemperature: temperatures.length ? Math.max(...temperatures) : null,
    maximumWindSpeed: winds.length ? Math.max(...winds) : null,
    hasRain: conditions.some((condition) => /hujan|petir/i.test(condition)),
    forecastTime: entry.forecasts[0]?.datetime ?? null,
  };
}

function availableNumbers(
  samples: RegionalWeatherSample[],
  key: "minimumTemperature" | "maximumTemperature" | "maximumWindSpeed",
) {
  return samples.flatMap((item) => {
    const value = item[key];
    return value == null ? [] : [value];
  });
}

export function buildRegionalWeatherSummary(
  regency: RegionCandidate,
  parsed: ParsedWeatherIntent,
  entries: RegionalForecastEntry[],
): RegionalWeatherSummary {
  const samples = entries.map(sample);
  const available = samples.filter((item) => item.conditions.length > 0);
  const conditionCounts = new Map<string, number>();
  for (const item of available)
    for (const condition of item.conditions)
      conditionCounts.set(condition, (conditionCounts.get(condition) ?? 0) + 1);
  const minimumTemperatures = availableNumbers(available, "minimumTemperature");
  const maximumTemperatures = availableNumbers(available, "maximumTemperature");
  const winds = availableNumbers(available, "maximumWindSpeed");
  return {
    regencyCode: regency.regencyCode,
    regencyName: regency.regencyName,
    context: contextLabel(parsed),
    sampledAreaCount: samples.length,
    availableAreaCount: available.length,
    unavailableAreaCount: samples.length - available.length,
    rainAreaCount: available.filter((item) => item.hasRain).length,
    conditions: [...conditionCounts.entries()]
      .map(([description, areaCount]) => ({ description, areaCount }))
      .sort(
        (left, right) =>
          right.areaCount - left.areaCount ||
          left.description.localeCompare(right.description, "id"),
      ),
    minimumTemperature: minimumTemperatures.length
      ? Math.min(...minimumTemperatures)
      : null,
    maximumTemperature: maximumTemperatures.length
      ? Math.max(...maximumTemperatures)
      : null,
    maximumWindSpeed: winds.length ? Math.max(...winds) : null,
    samples,
    generatedAt: new Date().toISOString(),
  };
}

function temperatureRange(summary: RegionalWeatherSummary) {
  if (summary.minimumTemperature == null || summary.maximumTemperature == null)
    return "suhu belum tersedia";
  return summary.minimumTemperature === summary.maximumTemperature
    ? `suhu sekitar ${summary.minimumTemperature}°C`
    : `suhu ${summary.minimumTemperature}–${summary.maximumTemperature}°C`;
}

export function generateRegionalWeatherAnswer(summary: RegionalWeatherSummary) {
  if (!summary.availableAreaCount)
    return `Data prakiraan BMKG untuk ringkasan ${summary.regencyName} ${summary.context} belum tersedia pada wilayah perwakilan yang diperiksa. Silakan pilih kecamatan dan desa/kelurahan untuk pemeriksaan yang lebih spesifik. Sumber data: BMKG.`;
  const conditions = summary.conditions
    .slice(0, 4)
    .map((item) => `${item.description} (${item.areaCount} wilayah)`)
    .join(", ");
  const rain = summary.rainAreaCount
    ? `${summary.rainAreaCount} dari ${summary.availableAreaCount} wilayah perwakilan memiliki prakiraan hujan atau petir`
    : "belum terlihat prakiraan hujan pada wilayah perwakilan yang datanya tersedia";
  const wind =
    summary.maximumWindSpeed == null
      ? "kecepatan angin maksimum belum tersedia"
      : `angin maksimum ${summary.maximumWindSpeed} km/jam`;
  return `Ringkasan umum ${summary.regencyName} ${summary.context} berdasarkan ${summary.availableAreaCount} wilayah perwakilan: ${conditions}; ${temperatureRange(summary)}; ${wind}; ${rain}. Ringkasan ini merupakan gambaran beberapa wilayah dan kondisi setiap kecamatan atau desa/kelurahan dapat berbeda. Sumber data: BMKG.`;
}
