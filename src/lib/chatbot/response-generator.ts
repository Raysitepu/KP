import type { ParsedWeatherIntent } from "@/types/chatbot";
import type { RegionRecord } from "@/types/regions";
import type { NormalizedForecast, WeatherResponse } from "@/types/weather";
import type { WarningResponse, WeatherWarning } from "@/types/warning";
import { timezoneLabel } from "./forecast-selector";

const SOURCE = "Sumber data: BMKG.";
const periodLabels = {
  dawn: "dini hari",
  morning: "pagi",
  noon: "siang",
  afternoon: "sore",
  evening: "malam",
} as const;

function fullLocation(region: RegionRecord) {
  return `${region.villageName}, Kecamatan ${region.districtName}, ${region.regencyName}`;
}

function contextLabel(parsed: ParsedWeatherIntent) {
  const day =
    parsed.day === "tomorrow"
      ? "besok"
      : parsed.day === "day_after_tomorrow"
        ? "lusa"
        : "hari ini";
  return parsed.period ? `${day} ${periodLabels[parsed.period]}` : day;
}

function values(items: NormalizedForecast[], key: "temperature" | "humidity") {
  return items
    .map((item) => item[key])
    .filter((item): item is number => item != null);
}

function range(numbers: number[], suffix: string) {
  if (!numbers.length) return "tidak tersedia";
  const minimum = Math.min(...numbers);
  const maximum = Math.max(...numbers);
  return minimum === maximum
    ? `${minimum}${suffix}`
    : `${minimum}–${maximum}${suffix}`;
}

function conditions(items: NormalizedForecast[]) {
  return [...new Set(items.map((item) => item.weatherDescription))].join(", ");
}

function updatedAt(weather: WeatherResponse, item?: NormalizedForecast) {
  const raw = item?.analysisDate ?? weather.fetchedAt;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return ` Data diperbarui ${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: weather.location.timezone,
  }).format(parsed)}.`;
}

export function generateWeatherAnswer(
  parsed: ParsedWeatherIntent,
  region: RegionRecord,
  weather: WeatherResponse,
  forecasts: NormalizedForecast[],
) {
  if (!forecasts.length)
    return `Data prakiraan untuk waktu tersebut belum tersedia dari BMKG. Saya hanya dapat menampilkan periode prakiraan yang saat ini tersedia. ${SOURCE}`;
  const primary = forecasts[0];
  const location = fullLocation(region);
  const context = contextLabel(parsed);
  const zone = timezoneLabel(weather.location.timezone);
  const time = `${primary.time} ${zone}`;
  const update = updatedAt(weather, primary);

  if (parsed.asksThreeDays) {
    const days = Object.entries(
      forecasts.reduce<Record<string, NormalizedForecast[]>>((result, item) => {
        (result[item.date] ??= []).push(item);
        return result;
      }, {}),
    )
      .slice(0, 3)
      .map(
        ([date, items]) =>
          `${new Intl.DateTimeFormat("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: weather.location.timezone,
          }).format(
            new Date(`${date}T12:00:00Z`),
          )}: ${conditions(items)}, suhu ${range(values(items, "temperature"), "°C")}`,
      )
      .join("; ");
    return `Prakiraan tiga hari untuk ${location}: ${days}.${update} ${SOURCE}`;
  }

  switch (parsed.intent) {
    case "rain_forecast": {
      const rain = forecasts.filter((item) =>
        /hujan|petir/i.test(item.weatherDescription),
      );
      if (!rain.length)
        return `Belum terlihat prakiraan hujan di ${location} pada ${context} dalam interval data yang tersedia. Kondisi yang tercantum: ${conditions(forecasts)}.${update} ${SOURCE}`;
      const first = rain[0];
      const last = rain.at(-1) ?? first;
      return `Ya, terdapat prakiraan ${first.weatherDescription.toLocaleLowerCase("id-ID")} di ${location} ${context}, sekitar pukul ${first.time}${last.time !== first.time ? `–${last.time}` : ""} ${zone}. Sebaiknya membawa payung atau jas hujan jika beraktivitas di luar.${update} ${SOURCE}`;
    }
    case "temperature":
      return `Suhu prakiraan di ${location} ${context} adalah ${range(values(forecasts, "temperature"), "°C")}. Prakiraan terdekat tercatat pukul ${time}.${update} ${SOURCE}`;
    case "humidity":
      return `Kelembapan prakiraan di ${location} ${context} adalah ${range(values(forecasts, "humidity"), "%")}. Prakiraan terdekat tercatat pukul ${time}.${update} ${SOURCE}`;
    case "wind":
      return primary.windSpeed == null
        ? `Data kecepatan angin untuk ${location} ${context} belum tersedia. ${SOURCE}`
        : `Kecepatan angin di ${location} ${context} diprakirakan sekitar ${primary.windSpeed} km/jam${primary.windDirection ? ` dari arah ${primary.windDirection}` : ""} pada pukul ${time}.${update} ${SOURCE}`;
    case "visibility":
      return `Jarak pandang di ${location} ${context} diprakirakan ${primary.visibility ?? "belum tersedia"} pada pukul ${time}.${update} ${SOURCE}`;
    case "cloud_cover":
      return primary.cloudCover == null
        ? `Data tutupan awan untuk ${location} ${context} belum tersedia. ${SOURCE}`
        : `Tutupan awan di ${location} ${context} diprakirakan ${primary.cloudCover}% pada pukul ${time}.${update} ${SOURCE}`;
    case "outdoor_recommendation": {
      const severeRain = forecasts.some((item) =>
        /hujan lebat|petir/i.test(item.weatherDescription),
      );
      const lightRain = forecasts.some((item) =>
        /hujan/i.test(item.weatherDescription),
      );
      const strongWind = forecasts.some(
        (item) => item.windSpeed != null && item.windSpeed >= 30,
      );
      const lowVisibility = forecasts.some((item) => {
        const match = item.visibility?.match(/[\d.]+/);
        return match ? Number(match[0]) < 5 : false;
      });
      const advice = severeRain
        ? "kondisi kurang disarankan untuk kegiatan luar ruangan; pertimbangkan menunda aktivitas karena ada prakiraan hujan lebat atau petir"
        : lightRain
          ? "siapkan payung atau jas hujan jika tetap beraktivitas di luar"
          : strongWind
            ? "berhati-hatilah di sekitar pohon, baliho, dan benda yang mudah tertiup"
            : lowVisibility
              ? "berhati-hatilah saat berkendara karena jarak pandang diprakirakan rendah"
              : "tidak ada indikator cuaca signifikan pada interval prakiraan yang dipilih, tetapi kondisi keselamatan tidak dapat dijamin";
      return `Berdasarkan prakiraan BMKG untuk ${location} ${context}, ${advice}. Kondisi cuaca: ${conditions(forecasts)}.${update} ${SOURCE}`;
    }
    default:
      return `Prakiraan cuaca di ${location} ${context} adalah ${conditions(forecasts)}. Suhu sekitar ${range(values(forecasts, "temperature"), "°C")}, kelembapan ${range(values(forecasts, "humidity"), "%")}, dengan prakiraan terdekat pukul ${time}.${update} ${SOURCE}`;
  }
}

export function generateWarningAnswer(
  region: RegionRecord,
  response: WarningResponse,
  alerts: WeatherWarning[],
) {
  const location = fullLocation(region);
  if (response.status === "unavailable")
    return `Sistem gagal memeriksa peringatan BMKG untuk ${location}. Status peringatan belum dapat dipastikan. ${SOURCE}`;
  if (response.status === "none")
    return `Tidak ada peringatan dini cuaca aktif pada feed BMKG Sumatera Utara saat diperiksa. Ini bukan pernyataan bahwa kondisi dijamin aman. ${SOURCE}`;
  if (!alerts.length)
    return `Ada peringatan dini aktif di Sumatera Utara, tetapi ${location} tidak tercantum sebagai wilayah terdampak pada data yang tersedia. Tetap ikuti pembaruan resmi BMKG. ${SOURCE}`;
  const first = alerts[0];
  const expires = first.expires
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: region.timezone,
      }).format(new Date(first.expires))
    : "waktu yang belum tersedia";
  return `Peringatan dini BMKG sedang aktif untuk wilayah yang mencakup ${location}. ${first.headline ?? first.event ?? "Peringatan cuaca"} berlaku hingga ${expires}. ${first.instruction ?? "Tingkatkan kewaspadaan dan ikuti informasi resmi BMKG."} ${SOURCE}`;
}

export function generateComparisonAnswer(
  left: { region: RegionRecord; item: NormalizedForecast },
  right: { region: RegionRecord; item: NormalizedForecast },
) {
  const summary = (entry: typeof left) =>
    `${entry.region.villageName}: ${entry.item.weatherDescription}, ${entry.item.temperature ?? "suhu tidak tersedia"}°C, kelembapan ${entry.item.humidity ?? "tidak tersedia"}%`;
  return `Perbandingan prakiraan: ${summary(left)}; ${summary(right)}. Waktu prakiraan mengikuti zona waktu masing-masing wilayah. ${SOURCE}`;
}
