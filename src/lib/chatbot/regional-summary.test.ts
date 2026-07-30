import { describe, expect, it } from "vitest";
import { parseWeatherIntent } from "@/lib/chatbot/intent-parser";
import {
  buildRegionalWeatherSummary,
  generateRegionalWeatherAnswer,
} from "@/lib/chatbot/regional-summary";
import { getRepresentativeRegionsForRegency } from "@/lib/regions/region-service";
import type { NormalizedForecast } from "@/types/weather";

function forecast(
  weatherDescription: string,
  temperature: number,
  windSpeed: number,
): NormalizedForecast {
  return {
    datetime: "2026-07-22T09:00:00+07:00",
    localDatetime: "2026-07-22 09:00:00",
    utcDatetime: "2026-07-22T02:00:00Z",
    date: "2026-07-22",
    time: "09:00",
    temperature,
    humidity: 80,
    weatherDescription,
    weatherDescriptionEn: null,
    windSpeed,
    windDirection: "S",
    cloudCover: 75,
    visibility: "8000 m",
    iconUrl: null,
    analysisDate: null,
  };
}

describe("ringkasan cuaca kabupaten/kota", () => {
  it("mengagregasi kondisi nyata tanpa menganggap semua kecamatan sama", () => {
    const regions = getRepresentativeRegionsForRegency("12.71", 3);
    expect(regions).toHaveLength(3);
    const regency = {
      ...regions[0],
      level: "regency" as const,
      label: "Ringkasan umum Kota Medan",
    };
    const summary = buildRegionalWeatherSummary(
      regency,
      parseWeatherIntent("Cuaca Kota Medan secara umum hari ini"),
      [
        { region: regions[0], forecasts: [forecast("Hujan Ringan", 25, 9)] },
        { region: regions[1], forecasts: [forecast("Cerah", 32, 14)] },
        { region: regions[2], forecasts: [] },
      ],
    );

    expect(summary.sampledAreaCount).toBe(3);
    expect(summary.availableAreaCount).toBe(2);
    expect(summary.unavailableAreaCount).toBe(1);
    expect(summary.rainAreaCount).toBe(1);
    expect(summary.minimumTemperature).toBe(25);
    expect(summary.maximumTemperature).toBe(32);
    expect(summary.maximumWindSpeed).toBe(14);
    expect(summary.conditions).toEqual([
      { description: "Cerah", areaCount: 1 },
      { description: "Hujan Ringan", areaCount: 1 },
    ]);

    const answer = generateRegionalWeatherAnswer(summary);
    expect(answer).toContain("Ringkasan umum Kota Medan");
    expect(answer).toContain("wilayah perwakilan");
    expect(answer).toContain("kondisi setiap kecamatan");
    expect(answer).toContain("Sumber data: BMKG");
  });

  it("memberi label waktu tiga hari dengan benar", () => {
    const regions = getRepresentativeRegionsForRegency("12.71", 1);
    const summary = buildRegionalWeatherSummary(
      { ...regions[0], level: "regency", label: "Ringkasan umum Kota Medan" },
      parseWeatherIntent("Prakiraan Kota Medan secara umum tiga hari"),
      [{ region: regions[0], forecasts: [forecast("Berawan", 28, 7)] }],
    );

    expect(summary.context).toBe("untuk tiga hari ke depan");
  });
});
