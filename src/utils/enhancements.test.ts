import { describe, expect, it } from "vitest";
import { filterEarthquakes } from "@/hooks/use-earthquake-filters";
import {
  earthquakeColor,
  clusterEarthquakes,
} from "@/components/map/earthquake-markers";
import { isAllowedBmkgShakemapUrl } from "@/utils/earthquake";
import type { Earthquake } from "@/types/earthquake";

const quake = (
  id: string,
  latitude: number,
  longitude: number,
  magnitude: number,
): Earthquake => ({
  id,
  latitude,
  longitude,
  magnitude,
  date: "20 Jul 2026",
  time: "10:00 WIB",
  datetime: null,
  depth: "10 km",
  region: "Sumatera Utara",
  potential: "Tidak berpotensi tsunami",
  felt: null,
  shakemapUrl: null,
});
describe("filter gempa WebGIS", () => {
  const items = [
    quake("near", 3.6, 98.7, 3.5),
    quake("middle", 4.7, 98.6, 4.5),
    quake("far", -6.2, 106.8, 5.5),
  ];
  it.each([100, 250, 500] as const)("menerapkan radius %s km", (radius) => {
    const result = filterEarthquakes(items, {
      radius,
      minMagnitude: 0,
      maxMagnitude: 10,
      center: { latitude: 3.5, longitude: 98.6 },
    });
    expect(result.every((item) => item.distanceKm! <= radius)).toBe(true);
  });
  it("mendukung seluruh Indonesia dan rentang magnitudo", () => {
    expect(
      filterEarthquakes(items, {
        radius: "all",
        minMagnitude: 4,
        maxMagnitude: 5,
        center: undefined,
      }).map((item) => item.id),
    ).toEqual(["middle"]);
  });
  it("menghasilkan empty state data saat tidak cocok", () => {
    expect(
      filterEarthquakes(items, {
        radius: "all",
        minMagnitude: 8,
        maxMagnitude: 9,
      }),
    ).toEqual([]);
  });
});
describe("marker dan cluster", () => {
  it("memberi warna berdasarkan magnitudo", () => {
    expect(earthquakeColor(3.9)).toBe("#eab308");
    expect(earthquakeColor(4.5)).toBe("#f97316");
    expect(earthquakeColor(5)).toBe("#dc2626");
  });
  it("mengelompokkan banyak marker tanpa membuang data", () => {
    const items = Array.from({ length: 10 }, (_, index) => ({
      ...quake(String(index), 3 + index * 0.01, 98 + index * 0.01, 4),
      distanceKm: null,
    }));
    expect(
      clusterEarthquakes(items).flatMap((item) => item.items),
    ).toHaveLength(10);
  });
});
describe("Shakemap", () => {
  it("hanya menerima URL BMKG", () => {
    expect(
      isAllowedBmkgShakemapUrl("https://data.bmkg.go.id/DataMKG/TEWS/test.jpg"),
    ).toBe(true);
    expect(isAllowedBmkgShakemapUrl("https://evil.example/test.jpg")).toBe(
      false,
    );
    expect(isAllowedBmkgShakemapUrl("rusak")).toBe(false);
    expect(isAllowedBmkgShakemapUrl(null)).toBe(false);
  });
});
