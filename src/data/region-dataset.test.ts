import { describe, expect, it } from "vitest";
import dataset from "./sumut-regions.json";
import type { RegionDataset } from "@/types/weather";
import { searchRegions } from "@/utils/regions";

const regions = dataset as RegionDataset;
describe("dataset wilayah Sumatera Utara", () => {
  it("memiliki provinsi dan 33 kabupaten/kota", () => {
    expect(regions.province).toEqual({ code: "12", name: "Sumatera Utara" });
    expect(regions.regencies).toHaveLength(33);
  });
  it("memiliki 455 kecamatan dengan parent kabupaten valid", () => {
    const parents = new Set(regions.regencies.map((item) => item.code));
    expect(regions.districts).toHaveLength(455);
    expect(
      regions.districts.every((item) => parents.has(item.regencyCode)),
    ).toBe(true);
  });
  it("memiliki 6110 desa dengan parent kecamatan valid", () => {
    const parents = new Set(regions.districts.map((item) => item.code));
    expect(regions.villages).toHaveLength(6110);
    expect(
      regions.villages.every((item) => parents.has(item.districtCode)),
    ).toBe(true);
  });
  it("semua adm4 valid dan unik", () => {
    const codes = regions.villages.map((item) => item.adm4);
    expect(codes.every((code) => /^12\.\d{2}\.\d{2}\.\d{4}$/.test(code))).toBe(
      true,
    );
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("mencari kabupaten, kecamatan, desa, dan adm4", () => {
    expect(
      searchRegions(regions.villages, "Kota Medan").length,
    ).toBeGreaterThan(0);
    expect(
      searchRegions(regions.villages, "Medan Helvetia").length,
    ).toBeGreaterThan(0);
    expect(searchRegions(regions.villages, "Helvetia").length).toBeGreaterThan(
      0,
    );
    expect(searchRegions(regions.villages, "12.71.03.1001")[0]?.adm4).toBe(
      "12.71.03.1001",
    );
  });
});
