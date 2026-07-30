import { describe, expect, it } from "vitest";
import { coordinateSchema, routeGeometrySchema } from "@/schemas/route";
import {
  haversineDistanceKm,
  routeLengthKm,
  sampleRoutePoints,
} from "@/lib/routing/route-sampler";
import {
  durationAtDistance,
  estimatedArrivalTime,
} from "@/lib/routing/route-time-calculator";
import { selectForecastByArrivalTime } from "@/lib/bmkg/forecast-selector";
import { classifyWeatherRisk } from "@/lib/route-weather/risk-classifier";
import { weatherMarkerPresentation } from "@/lib/route-weather/weather-presentation";
import {
  buildRouteWeatherSummary,
  uniqueAdm4Codes,
} from "@/lib/route-weather/route-weather-summary";
import type { RouteGeometry, RouteWeatherPoint } from "@/types/route";
import type { NormalizedForecast } from "@/types/weather";

const geometry: RouteGeometry = {
  type: "LineString",
  coordinates: [
    [98.6722, 3.5952],
    [98.59, 3.42],
    [98.5089, 3.1947],
  ],
};

const forecast = (
  datetime: string,
  description = "Cerah Berawan",
): NormalizedForecast => ({
  datetime,
  utcDatetime: datetime,
  localDatetime: datetime,
  date: datetime.slice(0, 10),
  time: datetime.slice(11, 16),
  temperature: 27,
  humidity: 80,
  weatherDescription: description,
  weatherDescriptionEn: null,
  windSpeed: 8,
  windDirection: "SE",
  cloudCover: 60,
  visibility: "10 km",
  iconUrl: null,
  analysisDate: "2026-07-22T00:00:00Z",
});

describe("validasi dan geometri rute", () => {
  it("menolak koordinat di luar rentang", () => {
    expect(
      coordinateSchema.safeParse({ latitude: 95, longitude: 120 }).success,
    ).toBe(false);
    expect(routeGeometrySchema.safeParse(geometry).success).toBe(true);
  });

  it("menghitung jarak sepanjang garis", () => {
    expect(haversineDistanceKm([0, 0], [1, 0])).toBeCloseTo(111.2, 0);
    expect(routeLengthKm(geometry)).toBeGreaterThan(40);
  });

  it("menyertakan awal dan tujuan serta maksimal 15 titik", () => {
    const longGeometry: RouteGeometry = {
      type: "LineString",
      coordinates: Array.from({ length: 201 }, (_, index) => [
        100 + index * 0.01,
        0,
      ]),
    };
    const points = sampleRoutePoints(
      longGeometry,
      222_000,
      18_000,
      "2026-07-22T05:30:00Z",
    );
    expect(points.length).toBeLessThanOrEqual(15);
    expect(points[0].longitude).toBe(100);
    expect(points.at(-1)?.longitude).toBeCloseTo(102, 5);
  });
});

describe("ETA dan prakiraan", () => {
  it("menghitung durasi proporsional dan waktu tiba", () => {
    expect(durationAtDistance(50_000, 100_000, 7_200)).toBe(3_600);
    expect(estimatedArrivalTime("2026-07-22T05:30:00Z", 3_600)).toBe(
      "2026-07-22T06:30:00.000Z",
    );
  });

  it("memilih forecast terdekat dan menolak waktu di luar cakupan", () => {
    const forecasts = [
      forecast("2026-07-22T06:00:00Z"),
      forecast("2026-07-22T09:00:00Z", "Hujan Ringan"),
    ];
    expect(
      selectForecastByArrivalTime(forecasts, new Date("2026-07-22T08:20:00Z"))
        .forecast?.weatherDescription,
    ).toBe("Hujan Ringan");
    expect(
      selectForecastByArrivalTime(forecasts, new Date("2026-07-25T08:20:00Z"))
        .status,
    ).toBe("unavailable");
  });
});

describe("risiko, deduplikasi, dan ringkasan", () => {
  const point = (
    id: string,
    adm4: string,
    weather: NormalizedForecast | null,
  ): RouteWeatherPoint => ({
    id,
    index: Number(id.at(-1)) - 1,
    latitude: 3,
    longitude: 98,
    distanceFromOriginKm: Number(id.at(-1)) * 10,
    durationFromOriginMinutes: 20,
    estimatedArrivalTime: "2026-07-22T08:00:00Z",
    region: {
      adm1: "12",
      adm2: "12.01",
      adm3: "12.01.01",
      adm4,
      provinceName: "Sumatera Utara",
      regencyName: "Kabupaten Contoh",
      districtName: "Kecamatan Contoh",
      villageName: "Desa Contoh",
      timezone: "Asia/Jakarta",
      matchedBy: "polygon",
    },
    forecast: weather,
    forecastStatus: weather ? "available" : "unavailable",
    status: classifyWeatherRisk(weather),
    staleCache: false,
  });

  it("mengklasifikasikan kondisi secara deterministik", () => {
    expect(classifyWeatherRisk(forecast("2026-07-22T06:00:00Z"))).toBe(
      "normal",
    );
    expect(
      classifyWeatherRisk(
        forecast("2026-07-22T06:00:00Z", "Hujan Lebat disertai Petir"),
      ),
    ).toBe("warning");
    expect(classifyWeatherRisk(null)).toBe("unknown");
  });

  it("memberi simbol berbeda untuk kondisi cuaca yang berbeda", () => {
    expect(
      weatherMarkerPresentation(
        forecast("2026-07-22T06:00:00Z", "Cerah Berawan"),
        "normal",
      ),
    ).toMatchObject({ symbol: "⛅", label: "Cerah berawan" });
    expect(
      weatherMarkerPresentation(
        forecast("2026-07-22T06:00:00Z", "Hujan Petir"),
        "warning",
      ),
    ).toMatchObject({ symbol: "⚡" });
    expect(weatherMarkerPresentation(null, "unknown")).toMatchObject({
      symbol: "?",
    });
  });

  it("mendeduplikasi ADM4 dan menyusun ringkasan", () => {
    const points = [
      point("point-1", "12.01.01.1001", forecast("2026-07-22T06:00:00Z")),
      point(
        "point-2",
        "12.01.01.1001",
        forecast("2026-07-22T09:00:00Z", "Hujan Ringan"),
      ),
      point(
        "point-3",
        "12.01.01.1002",
        forecast("2026-07-22T12:00:00Z", "Hujan Lebat"),
      ),
    ];
    expect(uniqueAdm4Codes(points)).toEqual(["12.01.01.1001", "12.01.01.1002"]);
    const summary = buildRouteWeatherSummary(points);
    expect(summary.rainPointCount).toBe(2);
    expect(summary.worstCondition).toBe("Hujan Lebat");
  });
});
