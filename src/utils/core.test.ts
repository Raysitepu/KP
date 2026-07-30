import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isValidSumutAdm4,
  flattenForecasts,
  selectCurrentForecast,
} from "./weather";
import { searchRegions } from "./regions";
import {
  haversineKm,
  isAllowedBmkgShakemapUrl,
  parseCoordinates,
} from "./earthquake";
import { normalizeWeather } from "@/services/bmkg-weather.service";
import { normalizeEarthquakes } from "@/services/bmkg-earthquake.service";
import { fetchJson, ServiceError } from "@/services/fetch-json";
import type { Region } from "@/types/weather";

const region: Region = {
  provinceCode: "12",
  regencyCode: "12.71",
  districtCode: "12.71.03",
  adm4: "12.71.03.1001",
  province: "Sumatera Utara",
  regency: "Kota Medan",
  district: "Medan Helvetia",
  village: "Helvetia",
  label: "Helvetia, Medan Helvetia, Kota Medan",
  searchText: "helvetia medan helvetia kota medan sumatera utara",
  latitude: null,
  longitude: null,
  timezone: "Asia/Jakarta",
  bmkgPageUrl: "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/12.71.03.1001",
  validationStatus: "pending",
};
const rawWeather = {
  lokasi: {
    provinsi: "Sumatera Utara",
    kotkab: "Kota Medan",
    kecamatan: "Medan Helvetia",
    desa: "Helvetia",
    lat: 3.6,
    lon: 98.6,
    timezone: "Asia/Jakarta",
    adm4: region.adm4,
  },
  data: [
    {
      cuaca: [
        [
          {
            local_datetime: "2026-07-16 09:00:00",
            t: 29,
            hu: 80,
            weather_desc: "Berawan",
            ws: 8,
          },
        ],
        [
          {
            local_datetime: "2026-07-16 12:00:00",
            t: 31,
            hu: 72,
            weather_desc: "Cerah Berawan",
            ws: 10,
          },
        ],
      ],
    },
  ],
};

describe("kode wilayah dan pencarian", () => {
  it("menerima ADM4 Sumatera Utara yang valid", () =>
    expect(isValidSumutAdm4(region.adm4)).toBe(true));
  it("menolak wilayah di luar Sumatera Utara", () =>
    expect(isValidSumutAdm4("31.71.03.1001")).toBe(false));
  it("mencari nama desa secara case-insensitive", () =>
    expect(searchRegions([region], "helVEtia")).toEqual([region]));
  it("mencari nama kecamatan dan merapikan spasi", () =>
    expect(searchRegions([region], "  medan   helvetia ")).toEqual([region]));
});

describe("normalisasi prakiraan", () => {
  it("meratakan array prakiraan bertingkat", () =>
    expect(flattenForecasts([[1], [[2, 3]]])).toEqual([1, 2, 3]));
  it("menormalisasi respons cuaca", () =>
    expect(normalizeWeather(rawWeather, region.adm4).forecasts).toHaveLength(
      2,
    ));
  it("mengelompokkan berdasarkan tanggal", () =>
    expect(
      Object.keys(normalizeWeather(rawWeather, region.adm4).grouped),
    ).toEqual(["2026-07-16"]));
  it("memilih prakiraan mendatang terdekat", () => {
    const items = normalizeWeather(rawWeather, region.adm4).forecasts;
    expect(
      selectCurrentForecast(items, new Date("2026-07-16T10:00:00+07:00"))?.time,
    ).toBe("12:00");
  });
  it("memilih prakiraan terakhir jika seluruh waktu lewat", () => {
    const items = normalizeWeather(rawWeather, region.adm4).forecasts;
    expect(
      selectCurrentForecast(items, new Date("2026-07-17T00:00:00+07:00"))?.time,
    ).toBe("12:00");
  });
  it("mengembalikan null untuk data kosong", () =>
    expect(selectCurrentForecast([])).toBeNull());
  it("menangani respons kosong sebagai error aman", () =>
    expect(() =>
      normalizeWeather({ lokasi: {}, data: [] }, region.adm4),
    ).toThrow(ServiceError));
});

describe("gempa", () => {
  it("mempertahankan urutan latitude, longitude", () =>
    expect(parseCoordinates("3.25,98.75")).toEqual([3.25, 98.75]));
  it("menormalisasi data gempa tunggal", () => {
    const result = normalizeEarthquakes(
      {
        Infogempa: {
          gempa: {
            Tanggal: "16 Jul 2026",
            Jam: "10:00 WIB",
            DateTime: "2026-07-16T03:00:00+00:00",
            Coordinates: "3.25,98.75",
            Magnitude: "5.2",
            Kedalaman: "10 km",
            Wilayah: "Sumatera Utara",
            Potensi: "Tidak berpotensi tsunami",
          },
        },
      },
      "latest",
    );
    expect(result.items[0]).toMatchObject({
      latitude: 3.25,
      longitude: 98.75,
      magnitude: 5.2,
    });
  });
  it("menghitung jarak Haversine", () =>
    expect(haversineKm(3.59, 98.67, 2.97, 99.06)).toBeGreaterThan(70));
  it("menghasilkan jarak nol untuk titik sama", () =>
    expect(haversineKm(3.59, 98.67, 3.59, 98.67)).toBe(0));
  it("memvalidasi URL shakemap BMKG", () => {
    expect(
      isAllowedBmkgShakemapUrl("https://data.bmkg.go.id/DataMKG/TEWS/test.jpg"),
    ).toBe(true);
    expect(isAllowedBmkgShakemapUrl("https://evil.test/test.jpg")).toBe(false);
  });
});

describe("fetch aman", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("menangani malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    await expect(fetchJson("https://example.test")).rejects.toMatchObject({
      code: "MALFORMED_JSON",
    });
  });
  it("menangani API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("x", { status: 503 })),
    );
    await expect(fetchJson("https://example.test")).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
    });
  });
  it("menangani timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );
    await expect(fetchJson("https://example.test", 5)).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });
});
