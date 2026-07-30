import { describe, expect, it } from "vitest";
import {
  normalizeRegionKey,
  normalizeRegionName,
  similarity,
} from "@/lib/regions/normalizer";
import { parseWeatherIntent } from "@/lib/chatbot/intent-parser";
import { selectForecasts } from "@/lib/chatbot/forecast-selector";
import { generateWeatherAnswer } from "@/lib/chatbot/response-generator";
import { isStaticFaqQuestion } from "@/lib/chatbot/static-faq";
import type { RegionCandidate } from "@/types/regions";
import type { WeatherResponse } from "@/types/weather";

const region: RegionCandidate = {
  provinceCode: "12",
  provinceName: "Sumatera Utara",
  regencyCode: "12.71",
  regencyName: "Kota Medan",
  districtCode: "12.71.11",
  districtName: "Medan Johor",
  villageCode: "12.71.11.1006",
  villageName: "Kwala Bekala",
  adm1: "12",
  adm2: "12.71",
  adm3: "12.71.11",
  adm4: "12.71.11.1006",
  latitude: 3.53,
  longitude: 98.67,
  timezone: "Asia/Jakarta",
  normalizedName: "kwala bekala medan johor kota medan sumatera utara",
  aliases: ["kwala bekala"],
  level: "village",
  label: "Kwala Bekala, Kecamatan Medan Johor, Kota Medan",
  score: 1,
  matchedBy: "exact",
};

const weather: WeatherResponse = {
  location: {
    province: "Sumatera Utara",
    regency: "Kota Medan",
    district: "Medan Johor",
    village: "Kwala Bekala",
    latitude: 3.53,
    longitude: 98.67,
    timezone: "Asia/Jakarta",
    adm4: region.adm4,
  },
  forecasts: [
    {
      datetime: "2026-07-22T12:00:00+07:00",
      localDatetime: "2026-07-22 12:00:00",
      utcDatetime: "2026-07-22T05:00:00Z",
      date: "2026-07-22",
      time: "12:00",
      temperature: 31,
      humidity: 72,
      weatherDescription: "Cerah Berawan",
      weatherDescriptionEn: "Partly Cloudy",
      windSpeed: 9,
      windDirection: "SE",
      cloudCover: 45,
      visibility: "> 10 km",
      iconUrl: null,
      analysisDate: "2026-07-22T00:00:00Z",
    },
    {
      datetime: "2026-07-22T19:00:00+07:00",
      localDatetime: "2026-07-22 19:00:00",
      utcDatetime: "2026-07-22T12:00:00Z",
      date: "2026-07-22",
      time: "19:00",
      temperature: 27,
      humidity: 88,
      weatherDescription: "Hujan Ringan",
      weatherDescriptionEn: "Light Rain",
      windSpeed: 7,
      windDirection: "E",
      cloudCover: 90,
      visibility: "8 km",
      iconUrl: null,
      analysisDate: "2026-07-22T00:00:00Z",
    },
    {
      datetime: "2026-07-23T07:00:00+07:00",
      localDatetime: "2026-07-23 07:00:00",
      utcDatetime: "2026-07-23T00:00:00Z",
      date: "2026-07-23",
      time: "07:00",
      temperature: 25,
      humidity: 91,
      weatherDescription: "Berawan",
      weatherDescriptionEn: "Cloudy",
      windSpeed: 5,
      windDirection: "N",
      cloudCover: 80,
      visibility: "9 km",
      iconUrl: null,
      analysisDate: "2026-07-22T00:00:00Z",
    },
  ],
  grouped: {},
  current: null,
  fetchedAt: "2026-07-22T00:00:00Z",
};

describe("normalisasi lokasi", () => {
  it("memahami singkatan dan variasi ejaan", () => {
    expect(normalizeRegionKey("Kab. Karo")).toBe("karo");
    expect(normalizeRegionName("Kaban  Jahe")).toBe("kabanjahe");
    expect(normalizeRegionName("TAPUT")).toBe("tapanuli utara");
  });

  it("memberi skor tinggi untuk typo ringan", () => {
    expect(similarity("berastgi", "berastagi")).toBeGreaterThan(0.8);
  });
});

describe("intent dan waktu prakiraan", () => {
  it("membedakan definisi statis dari pertanyaan lokasi dinamis", () => {
    expect(isStaticFaqQuestion("Apa arti kelembapan?")).toBe(true);
    expect(isStaticFaqQuestion("Apa arti kelembapan di Balige?")).toBe(false);
    expect(isStaticFaqQuestion("Apa itu peringatan dini di Karo?")).toBe(false);
  });

  it("mendeteksi hujan besok malam", () => {
    expect(parseWeatherIntent("Apakah besok malam hujan?")).toMatchObject({
      intent: "rain_forecast",
      dayOffset: 1,
      period: "evening",
    });
  });

  it("memilih interval lokal sesuai hari dan periode", () => {
    const parsed = parseWeatherIntent("Bagaimana besok pagi?");
    const result = selectForecasts(
      weather,
      parsed,
      new Date("2026-07-22T03:00:00Z"),
    );
    expect(result.map((item) => item.time)).toEqual(["07:00"]);
  });

  it("menghasilkan jawaban hujan tanpa angka buatan", () => {
    const parsed = parseWeatherIntent("Apakah malam ini hujan?");
    const forecasts = selectForecasts(
      weather,
      parsed,
      new Date("2026-07-22T03:00:00Z"),
    );
    const answer = generateWeatherAnswer(parsed, region, weather, forecasts);
    expect(answer).toContain("Hujan Ringan".toLocaleLowerCase("id-ID"));
    expect(answer).toContain("Sumber data: BMKG.");
  });
});
