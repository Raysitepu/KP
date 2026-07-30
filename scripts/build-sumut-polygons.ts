import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Region = {
  adm4: string;
  province: string;
  regency: string;
  district: string;
  village: string;
};

type RegionDataset = {
  villages: Region[];
};

const SOURCE_ROOT =
  "https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/main/db/kel/12";
const OUTPUT = resolve(".cache/sumut-adm4-polygons.geojson");

function swapLatLng(value: unknown): unknown {
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  )
    return [value[1], value[0]];
  if (Array.isArray(value)) return value.map(swapLatLng);
  return value;
}

function coordinateDepth(value: unknown): number {
  return Array.isArray(value) && value.length
    ? 1 + coordinateDepth(value[0])
    : 0;
}

const regencies = [
  ...Array.from({ length: 25 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  ),
  ...Array.from({ length: 8 }, (_, index) => String(index + 71)),
];
async function main() {
  const dataset = JSON.parse(
    await readFile(resolve("src/data/sumut-regions.json"), "utf8"),
  ) as RegionDataset;
  const regions = new Map(
    dataset.villages.map((region) => [region.adm4, region]),
  );
  const features: unknown[] = [];

  for (const adm2 of regencies) {
    const file = `wilayah_boundaries_kel_12.${adm2}.sql`;
    const response = await fetch(`${SOURCE_ROOT}/${file}`);
    if (!response.ok)
      throw new Error(`Gagal mengunduh ${file}: ${response.status}`);
    const sql = await response.text();
    const tuple =
      /\('(\d{2}\.\d{2}\.\d{2}\.\d{4})','((?:[^']|'')*)',[-\d.]+,[-\d.]+,'(\[\[\[.*\]\]\])'\)/g;

    for (const match of sql.matchAll(tuple)) {
      const region = regions.get(match[1]);
      if (!region) continue;
      const coordinates = swapLatLng(JSON.parse(match[3]));
      const geometryType =
        coordinateDepth(coordinates) === 4 ? "MultiPolygon" : "Polygon";
      features.push({
        type: "Feature",
        properties: {
          adm4: region.adm4,
          province_name: region.province,
          regency_name: region.regency,
          district_name: region.district,
          village_name: region.village,
          source: "cahyadsn/wilayah_boundaries",
          source_version: "Kepmendagri 2025",
        },
        geometry: { type: geometryType, coordinates },
      });
    }
    console.log(`Diproses 12.${adm2}: total ${features.length} polygon`);
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(
    OUTPUT,
    `${JSON.stringify({ type: "FeatureCollection", features })}\n`,
  );
  console.log(`GeoJSON selesai: ${OUTPUT} (${features.length} polygon)`);
}

void main();
