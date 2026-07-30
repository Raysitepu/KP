import faqData from "@/data/faq.json";
import type {
  FaqAction,
  FaqApplicationState,
  FaqEntry,
  FaqResult,
} from "@/types/faq";

export const FALLBACK =
  "Maaf, saya belum menemukan jawaban yang sesuai. Coba gunakan kata kunci seperti cuaca, suhu, gempa, magnitudo, peringatan dini, wilayah, atau WebGIS.";
export const SAFETY_ANSWER =
  "Sistem tidak dapat memastikan kondisi aman atau memprediksi kejadian bencana. Periksa informasi terbaru melalui kanal resmi BMKG dan ikuti arahan pihak berwenang.";
const DEFAULT_SUGGESTIONS = [
  "Bagaimana prakiraan cuaca Medan?",
  "Apakah ada gempa terbaru?",
  "Apa arti magnitudo?",
  "Apa arti kedalaman gempa?",
  "Apa arti severity pada peringatan?",
  "Apakah ada peringatan dini di Sumatera Utara?",
  "Bagaimana cara membaca peta WebGIS?",
  "Bagaimana mengganti wilayah?",
  "Bagaimana menyimpan wilayah favorit?",
  "Dari mana sumber data aplikasi ini?",
];
const EXTRA_ENTRIES: FaqEntry[] = [
  {
    id: "weather-medan",
    category: "cuaca",
    question: "Bagaimana prakiraan cuaca Medan?",
    keywords: ["cuaca medan", "prakiraan medan"],
    action: "GET_CURRENT_WEATHER",
  },
  {
    id: "term-severity",
    category: "istilah BMKG",
    question: "Apa arti severity pada peringatan?",
    keywords: ["arti severity", "severity peringatan"],
    answer:
      "Severity menunjukkan tingkat keparahan dampak yang diperkirakan dalam dokumen CAP BMKG, misalnya Minor, Moderate, Severe, atau Extreme.",
  },
  {
    id: "map-reading",
    category: "WebGIS",
    question: "Bagaimana cara membaca peta WebGIS?",
    keywords: ["membaca webgis", "cara membaca peta"],
    action: "OPEN_MAP_HELP",
  },
  {
    id: "favorite-unavailable",
    category: "penggunaan dashboard",
    question: "Bagaimana menyimpan wilayah favorit?",
    keywords: ["simpan wilayah favorit", "favorit"],
    answer:
      "Fitur wilayah favorit belum tersedia pada versi dashboard saat ini. Gunakan pencarian wilayah untuk mengganti wilayah aktif.",
  },
  {
    id: "safety-disclaimer-entry",
    category: "keselamatan",
    question: "Apakah aman bepergian?",
    keywords: [
      "aman keluar rumah",
      "aman bepergian",
      "gempa terjadi lagi",
      "tsunami pasti",
    ],
    answer: SAFETY_ANSWER,
  },
];
const entriesWithExtras = [...(faqData as FaqEntry[]), ...EXTRA_ENTRIES];
const STOP_WORDS = new Set([
  "apa",
  "apakah",
  "bagaimana",
  "mengapa",
  "data",
  "yang",
  "ini",
  "itu",
  "dan",
  "di",
  "ke",
  "dari",
  "cuaca",
  "gempa",
]);
export const normalizeFaqText = (value: string) =>
  value
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
const meaningful = (value: string) =>
  normalizeFaqText(value)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

function similarity(query: string, candidate: string) {
  const q = normalizeFaqText(query);
  const c = normalizeFaqText(candidate);
  if (q === c) return 1;
  const qWords = meaningful(q);
  const cWords = meaningful(c);
  if (!qWords.length || !cWords.length) return 0;
  const overlap = qWords.filter((word) => cWords.includes(word)).length;
  const coverage = overlap / Math.max(qWords.length, cWords.length);
  const phraseBonus = q.includes(c) || c.includes(q) ? 0.2 : 0;
  return Math.min(0.95, coverage + phraseBonus);
}

function actionAnswer(action: FaqAction, state: FaqApplicationState) {
  const weather = state.weather;
  const current = weather?.current;
  const quake = state.latestEarthquake;
  switch (action) {
    case "GET_ACTIVE_LOCATION":
      return weather
        ? `Wilayah aktif adalah ${weather.location.village}, ${weather.location.district}, ${weather.location.regency}.`
        : "Data wilayah aktif belum tersedia.";
    case "GET_CURRENT_WEATHER":
      return current && weather
        ? `Prakiraan terdekat di ${weather.location.village} adalah ${current.weatherDescription} pada pukul ${current.time} WIB.`
        : "Data cuaca untuk wilayah yang dipilih belum tersedia. Silakan coba memuat ulang data.";
    case "GET_CURRENT_TEMPERATURE":
      return current && weather && current.temperature != null
        ? `Suhu prakiraan terdekat di ${weather.location.village} adalah ${current.temperature}°C pada pukul ${current.time} WIB.`
        : "Data suhu untuk wilayah yang dipilih belum tersedia. Silakan coba memuat ulang data.";
    case "GET_CURRENT_HUMIDITY":
      return current && weather && current.humidity != null
        ? `Kelembapan prakiraan terdekat di ${weather.location.village} adalah ${current.humidity}% pada pukul ${current.time} WIB.`
        : "Data kelembapan untuk wilayah yang dipilih belum tersedia.";
    case "GET_CURRENT_WIND":
      return current && weather && current.windSpeed != null
        ? `Kecepatan angin prakiraan terdekat adalah ${current.windSpeed} km/jam${current.windDirection ? ` dari arah ${current.windDirection}` : ""}.`
        : "Data angin untuk wilayah yang dipilih belum tersedia.";
    case "GET_NEXT_FORECAST": {
      const next = weather?.forecasts.find(
        (item) => current && item.datetime > current.datetime,
      );
      return next
        ? `Prakiraan berikutnya pada pukul ${next.time} WIB: ${next.weatherDescription}, ${next.temperature ?? "suhu tidak tersedia"}°C.`
        : "Prakiraan berikutnya belum tersedia.";
    }
    case "GET_LATEST_EARTHQUAKE":
      return quake
        ? `Gempa terbaru bermagnitudo ${quake.magnitude ?? "tidak tersedia"}, kedalaman ${quake.depth}, di ${quake.region}. ${quake.potential}`
        : "Data gempa terbaru belum tersedia.";
    case "GET_LATEST_EARTHQUAKE_MAGNITUDE":
      return quake
        ? `Magnitudo gempa terbaru adalah ${quake.magnitude ?? "tidak tersedia"}. Lokasi: ${quake.region}.`
        : "Data magnitudo gempa terbaru belum tersedia.";
    case "GET_LATEST_EARTHQUAKE_TSUNAMI_STATUS":
      return quake
        ? `Status dari BMKG: ${quake.potential}. Tetap ikuti kanal resmi BMKG.`
        : "Status potensi tsunami gempa terbaru belum tersedia.";
    case "GET_WARNING_STATUS":
      return state.warning?.status === "active"
        ? `Terdapat ${state.warning.warnings.length} peringatan dini aktif dari BMKG. ${state.warning.warnings[0]?.headline ?? state.warning.warnings[0]?.event ?? "Detail tersedia pada panel peringatan"}.`
        : state.warning?.status === "none"
          ? "Tidak ada peringatan dini cuaca aktif untuk Sumatera Utara pada feed BMKG saat ini. Status ini bukan pernyataan bahwa wilayah aman."
          : "Data peringatan dini BMKG belum tersedia. Silakan coba kembali beberapa saat lagi.";
    case "GET_LAST_UPDATED":
      return state.lastUpdated
        ? `Data terakhir diambil pada ${state.lastUpdated}.`
        : "Waktu pembaruan terakhir belum tersedia.";
    case "OPEN_MAP_HELP":
      return "Geser peta untuk berpindah, gunakan kontrol plus/minus untuk zoom, kontrol layer untuk mengganti peta dasar, dan tekan marker untuk detail.";
    case "OPEN_WEATHER_DETAILS":
      return "Detail prakiraan tersedia pada bagian Cuaca setiap tiga jam dan Grafik prakiraan di dashboard.";
    case "OPEN_EARTHQUAKE_DETAILS":
      return "Detail gempa tersedia pada bagian Informasi gempa BMKG. Pilih tab dan tekan Lihat di peta untuk menuju episenter.";
  }
}

export function processFaqQuestion(
  question: string,
  state: FaqApplicationState,
  entries = entriesWithExtras,
): FaqResult {
  const normalized = normalizeFaqText(question);
  if (!normalized)
    return {
      answer: FALLBACK,
      suggestions: DEFAULT_SUGGESTIONS,
      confidence: 0,
      matchedId: null,
    };
  if (
    /(aman|bepergian|keluar rumah|terjadi lagi|tsunami pasti|prediksi gempa)/.test(
      normalized,
    )
  )
    return {
      answer: SAFETY_ANSWER,
      suggestions: DEFAULT_SUGGESTIONS,
      confidence: 1,
      matchedId: "safety-disclaimer",
    };
  let best: { entry: FaqEntry; score: number } | null = null;
  for (const entry of entries) {
    let score = similarity(normalized, entry.question);
    for (const keyword of entry.keywords)
      score = Math.max(score, similarity(normalized, keyword) * 0.92);
    if (!best || score > best.score) best = { entry, score };
  }
  if (!best || best.score < 0.48)
    return {
      answer: FALLBACK,
      suggestions: DEFAULT_SUGGESTIONS,
      confidence: best?.score ?? 0,
      matchedId: null,
    };
  const answer = best.entry.action
    ? actionAnswer(best.entry.action, state)
    : (best.entry.answer ?? FALLBACK);
  return {
    answer,
    suggestions:
      best.entry.suggestions ??
      entries
        .filter(
          (item) =>
            item.category === best.entry.category && item.id !== best.entry.id,
        )
        .slice(0, 3)
        .map((item) => item.question),
    confidence: best.score,
    matchedId: best.entry.id,
    action: best.entry.action,
  };
}

export const faqEntries = entriesWithExtras;
export const initialFaqSuggestions = DEFAULT_SUGGESTIONS;
