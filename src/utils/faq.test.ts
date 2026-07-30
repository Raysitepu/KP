import { describe, expect, it } from "vitest";
import {
  FALLBACK,
  SAFETY_ANSWER,
  initialFaqSuggestions,
  normalizeFaqText,
  processFaqQuestion,
} from "./faq";
import type { FaqApplicationState, FaqEntry } from "@/types/faq";
import type { WeatherResponse } from "@/types/weather";
import type { Earthquake } from "@/types/earthquake";

const weather: WeatherResponse = {
  location: {
    province: "Sumatera Utara",
    regency: "Kota Medan",
    district: "Medan Helvetia",
    village: "Helvetia",
    latitude: 3.6,
    longitude: 98.6,
    timezone: "Asia/Jakarta",
    adm4: "12.71.03.1001",
  },
  forecasts: [
    {
      datetime: "2026-07-16T09:00:00+07:00",
      date: "2026-07-16",
      time: "09:00",
      temperature: 29,
      humidity: 80,
      weatherDescription: "Cerah Berawan",
      weatherDescriptionEn: null,
      windSpeed: 8,
      windDirection: "Timur",
      cloudCover: 40,
      visibility: "> 10 km",
      iconUrl: null,
      analysisDate: null,
    },
    {
      datetime: "2026-07-16T12:00:00+07:00",
      date: "2026-07-16",
      time: "12:00",
      temperature: 31,
      humidity: 72,
      weatherDescription: "Berawan",
      weatherDescriptionEn: null,
      windSpeed: 10,
      windDirection: "Timur",
      cloudCover: 60,
      visibility: "> 10 km",
      iconUrl: null,
      analysisDate: null,
    },
  ],
  grouped: {},
  current: {
    datetime: "2026-07-16T09:00:00+07:00",
    date: "2026-07-16",
    time: "09:00",
    temperature: 29,
    humidity: 80,
    weatherDescription: "Cerah Berawan",
    weatherDescriptionEn: null,
    windSpeed: 8,
    windDirection: "Timur",
    cloudCover: 40,
    visibility: "> 10 km",
    iconUrl: null,
    analysisDate: null,
  },
  fetchedAt: "2026-07-16T02:00:00Z",
};
const earthquake: Earthquake = {
  id: "quake",
  date: "16 Jul 2026",
  time: "10:00 WIB",
  datetime: "2026-07-16T03:00:00Z",
  latitude: 1.6,
  longitude: 118,
  magnitude: 5.2,
  depth: "10 km",
  region: "120 km Barat Laut",
  potential: "Tidak berpotensi tsunami",
  felt: null,
  shakemapUrl: null,
};
const state: FaqApplicationState = {
  weather,
  latestEarthquake: earthquake,
  warning: {
    status: "none",
    province: "Sumatera Utara",
    checkedAt: "2026-07-16T08:00:00Z",
    feedUpdatedAt: null,
    message: "Tidak ada peringatan aktif",
    warnings: [],
  },
  lastUpdated: "16 Juli 2026 09.00",
};

describe("processFaqQuestion", () => {
  it("mencocokkan pertanyaan secara persis", () =>
    expect(processFaqQuestion("Apa arti kelembapan?", state).matchedId).toBe(
      "weather-04",
    ));
  it("mencocokkan keyword spesifik", () =>
    expect(
      processFaqQuestion("Saya ingin tahu kandungan uap air", state).matchedId,
    ).toBe("weather-04"));
  it("menormalisasi uppercase dan lowercase", () =>
    expect(processFaqQuestion("APA ARTI MAGNITUDO?", state).matchedId).toBe(
      "quake-02",
    ));
  it("menghapus spasi dan tanda baca berlebih", () =>
    expect(normalizeFaqText("  Berapa...   SUHU?? ")).toBe("berapa suhu"));
  it("menggunakan fallback untuk pertanyaan tidak dikenal", () =>
    expect(
      processFaqQuestion("siapa pemenang pertandingan kemarin", state).answer,
    ).toBe(FALLBACK));
  it("tidak memberi kepastian untuk pertanyaan keselamatan", () =>
    expect(processFaqQuestion("Apakah aman bepergian?", state).answer).toBe(
      SAFETY_ANSWER,
    ));
  it("menjelaskan istilah severity", () =>
    expect(
      processFaqQuestion("Apa arti severity pada peringatan?", state).answer,
    ).toContain("tingkat keparahan"));
  it("menyediakan seluruh pertanyaan yang disarankan", () => {
    expect(initialFaqSuggestions).toContain("Apa arti magnitudo?");
    expect(initialFaqSuggestions).toContain(
      "Bagaimana cara membaca peta WebGIS?",
    );
    expect(initialFaqSuggestions).toHaveLength(10);
  });
  it("menjawab suhu dari state", () =>
    expect(processFaqQuestion("Berapa suhu saat ini?", state).answer).toContain(
      "29°C",
    ));
  it("tidak mengarang suhu ketika state kosong", () =>
    expect(processFaqQuestion("Berapa suhu saat ini?", {}).answer).toContain(
      "belum tersedia",
    ));
  it("menjawab gempa terbaru dari state", () =>
    expect(processFaqQuestion("Ada gempa terbaru?", state).answer).toContain(
      "5.2",
    ));
  it("menjawab status tsunami persis dari state", () =>
    expect(
      processFaqQuestion("Apakah gempa terbaru berpotensi tsunami?", state)
        .answer,
    ).toContain("Tidak berpotensi tsunami"));
  it("tidak mengarang status peringatan ketika state kosong", () =>
    expect(
      processFaqQuestion("Apa status peringatan dini?", {}).answer,
    ).toContain("belum tersedia"));
  it("memberikan suggested questions", () =>
    expect(
      processFaqQuestion("Bagaimana cara mencari wilayah?", state).suggestions
        .length,
    ).toBeGreaterThan(0));
  it("menolak confidence rendah dan kata terlalu umum", () =>
    expect(
      processFaqQuestion("bagaimana data cuaca", state).matchedId,
    ).toBeNull());
  it("memilih skor terbaik dan bukan kecocokan satu kata umum", () => {
    const entries: FaqEntry[] = [
      {
        id: "a",
        category: "x",
        question: "Apa data cuaca?",
        keywords: ["data cuaca"],
        answer: "salah",
      },
      {
        id: "b",
        category: "x",
        question: "Mengapa peta gagal dimuat?",
        keywords: ["peta gagal dimuat"],
        answer: "benar",
      },
    ];
    expect(
      processFaqQuestion("peta gagal dimuat", state, entries).matchedId,
    ).toBe("b");
  });
});
