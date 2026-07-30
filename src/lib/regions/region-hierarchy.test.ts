import { describe, expect, it } from "vitest";
import regionDataset from "@/data/sumut-regions.json";
import {
  getRepresentativeRegionsForRegency,
  getVillageCandidatesForDistrict,
  resolveLocation,
} from "@/lib/regions/region-service";
import type { RegionDataset } from "@/types/weather";

const dataset = regionDataset as RegionDataset;

describe("pemilihan wilayah FAQ bertingkat", () => {
  it("meminta kecamatan ketika pertanyaan hanya menyebut kabupaten/kota", async () => {
    const result = await resolveLocation(
      "Bagaimana cuaca hari ini di Kota Medan?",
      null,
    );

    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") return;
    expect(result.message).toContain("Pilih Ringkasan umum");
    expect(result.candidates.length).toBeGreaterThan(1);
    expect(result.candidates[0].level).toBe("regency");
    expect(result.candidates[0].label).toBe("Ringkasan umum Kota Medan");
    const districts = result.candidates.filter(
      (item) => item.level === "district",
    );
    expect(districts).toHaveLength(21);
    expect(new Set(districts.map((item) => item.districtCode)).size).toBe(
      districts.length,
    );
    expect(districts.some((item) => item.districtName === "Medan Johor")).toBe(
      true,
    );
  });

  it("langsung membuka ringkasan umum ketika pengguna mengatakan saja", async () => {
    const result = await resolveLocation("Cuaca Medan saja", null);

    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.region.level).toBe("regency");
    expect(result.region.regencyName).toBe("Kota Medan");
  });

  it("menyediakan wilayah perwakilan untuk seluruh kabupaten/kota", () => {
    expect(dataset.regencies).toHaveLength(33);

    for (const regency of dataset.regencies) {
      const representatives = getRepresentativeRegionsForRegency(
        regency.code,
        5,
      );
      expect(representatives.length, regency.name).toBeGreaterThan(0);
      expect(representatives.length, regency.name).toBeLessThanOrEqual(5);
      expect(
        representatives.every((item) => item.regencyCode === regency.code),
        regency.name,
      ).toBe(true);
      expect(
        new Set(representatives.map((item) => item.districtCode)).size,
        regency.name,
      ).toBe(representatives.length);
    }
  });

  it("menampilkan desa/kelurahan setelah kecamatan dipilih", () => {
    const villages = getVillageCandidatesForDistrict("12.71.11");

    expect(villages.length).toBeGreaterThan(1);
    expect(villages.every((item) => item.level === "village")).toBe(true);
    expect(villages.every((item) => item.districtName === "Medan Johor")).toBe(
      true,
    );
    expect(villages.some((item) => item.villageName === "Kwala Bekala")).toBe(
      true,
    );
  });

  it("langsung meminta desa/kelurahan jika kecamatan disebut", async () => {
    const result = await resolveLocation(
      "Apakah malam ini hujan di Medan Johor?",
      null,
    );

    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") return;
    expect(result.message).toContain("Pilih desa/kelurahan");
    expect(result.candidates.every((item) => item.level === "village")).toBe(
      true,
    );
  });
});
