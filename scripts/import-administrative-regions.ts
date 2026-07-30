import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

type GeoJsonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoJsonGeometry;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

loadEnvConfig(process.cwd());

const sourcePath = process.argv[2];
if (!sourcePath)
  throw new Error(
    "Berikan path GeoJSON polygon ADM4: npm run data:import:polygons -- ./data/adm4-indonesia.geojson",
  );

const url = process.env.SUPABASE_URL;
const secret =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret)
  throw new Error("SUPABASE_URL dan secret server Supabase wajib diisi.");

const client = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function textProperty(properties: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = properties[name];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function timezoneFromAdm1(adm1: string) {
  if (
    [
      "51",
      "52",
      "53",
      "63",
      "64",
      "65",
      "71",
      "72",
      "73",
      "74",
      "75",
      "76",
    ].includes(adm1)
  )
    return "Asia/Makassar";
  if (["81", "82", "91", "92", "93", "94", "95", "96"].includes(adm1))
    return "Asia/Jayapura";
  return "Asia/Jakarta";
}

function normalizeAdm4(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length === 10
    ? `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
    : null;
}

function rowFromFeature(feature: GeoJsonFeature, index: number) {
  const properties = feature.properties ?? {};
  const adm4 = normalizeAdm4(
    textProperty(properties, [
      "adm4",
      "ADM4",
      "village_code",
      "KODE_DESA",
      "kode_desa",
      "KODE",
      "kode",
      "KDPPUM",
      "IDDESA",
    ]),
  );
  if (!adm4)
    throw new Error(`Feature ${index + 1} tidak memiliki ADM4 yang valid.`);
  const provinceName = textProperty(properties, [
    "province_name",
    "PROVINSI",
    "provinsi",
    "WADMPR",
  ]);
  const regencyName = textProperty(properties, [
    "regency_name",
    "KABKOT",
    "kabupaten",
    "WADMKK",
  ]);
  const districtName = textProperty(properties, [
    "district_name",
    "KECAMATAN",
    "kecamatan",
    "WADMKC",
  ]);
  const villageName = textProperty(properties, [
    "village_name",
    "DESA",
    "desa",
    "NAMOBJ",
    "WADMKD",
  ]);
  if (!provinceName || !regencyName || !districtName || !villageName)
    throw new Error(`Feature ${adm4} tidak memiliki nama wilayah lengkap.`);
  const geometry =
    feature.geometry.type === "Polygon"
      ? {
          type: "MultiPolygon" as const,
          coordinates: [feature.geometry.coordinates],
        }
      : feature.geometry;
  return {
    adm1: adm4.slice(0, 2),
    adm2: adm4.slice(0, 5),
    adm3: adm4.slice(0, 8),
    adm4,
    province_name: provinceName,
    regency_name: regencyName,
    district_name: districtName,
    village_name: villageName,
    timezone:
      textProperty(properties, ["timezone", "TIMEZONE", "zona_waktu"]) ??
      timezoneFromAdm1(adm4.slice(0, 2)),
    geometry,
    source: textProperty(properties, ["source", "SOURCE"]),
    source_version: textProperty(properties, ["source_version", "VERSION"]),
  };
}

async function main() {
  const raw = JSON.parse(
    await readFile(resolve(sourcePath!), "utf8"),
  ) as FeatureCollection;
  if (raw.type !== "FeatureCollection" || !Array.isArray(raw.features))
    throw new Error("File harus berupa GeoJSON FeatureCollection.");

  const rows = raw.features.map(rowFromFeature);
  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100);
    const { error } = await client
      .from("administrative_regions")
      .upsert(batch, { onConflict: "adm4" });
    if (error) throw new Error(`Import gagal: ${error.message}`);
    console.log(
      `Imported ${Math.min(index + batch.length, rows.length)}/${rows.length}`,
    );
  }

  console.log(
    `Selesai mengimpor ${rows.length} polygon ADM4 tanpa membuat kode baru.`,
  );
}

void main();
