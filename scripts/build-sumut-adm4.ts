import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Area = { code: string; name: string };
type ApiResponse = { data: Area[] };
type Region = {
  provinceCode: string;
  regencyCode: string;
  districtCode: string;
  adm4: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  label: string;
  searchText: string;
  latitude: null;
  longitude: null;
  timezone: string;
  bmkgPageUrl: string;
  validationStatus: "pending";
};

const API = "https://wilayah.id/api";
const ADM4 = /^12\.\d{2}\.\d{2}\.\d{4}$/;
const clean = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase("id-ID"));

async function getAreas(
  level: "regencies" | "districts" | "villages",
  parent: string,
): Promise<Area[]> {
  const response = await fetch(`${API}/${level}/${parent}.json`);
  if (!response.ok)
    throw new Error(
      `Gagal mengambil ${level}/${parent}: HTTP ${response.status}`,
    );
  return ((await response.json()) as ApiResponse).data;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const output: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await fn(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return output;
}

async function main() {
  const invalid: string[] = [];
  const regencies = await getAreas("regencies", "12");
  const districtGroups = await mapLimit(regencies, 6, async (regency) => ({
    regency,
    districts: await getAreas("districts", regency.code),
  }));
  const pairs = districtGroups.flatMap(({ regency, districts }) =>
    districts.map((district) => ({ regency, district })),
  );
  const groups = await mapLimit(pairs, 10, async ({ regency, district }) => ({
    regency,
    district,
    villages: await getAreas("villages", district.code),
  }));
  const unique = new Map<string, Region>();
  for (const { regency, district, villages } of groups)
    for (const village of villages) {
      if (!ADM4.test(village.code)) {
        invalid.push(village.code);
        continue;
      }
      const names = {
        regency: clean(regency.name),
        district: clean(district.name),
        village: clean(village.name),
      };
      const row: Region = {
        provinceCode: "12",
        regencyCode: regency.code,
        districtCode: district.code,
        adm4: village.code,
        province: "Sumatera Utara",
        ...names,
        label: `${names.village}, ${names.district}, ${names.regency}`,
        searchText:
          `${names.village} ${names.district} ${names.regency} Sumatera Utara`.toLocaleLowerCase(
            "id-ID",
          ),
        latitude: null,
        longitude: null,
        timezone: "Asia/Jakarta",
        bmkgPageUrl: `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${village.code}`,
        validationStatus: "pending",
      };
      unique.set(row.adm4, row);
    }
  const rows = [...unique.values()].sort(
    (a, b) =>
      a.regency.localeCompare(b.regency, "id") ||
      a.district.localeCompare(b.district, "id") ||
      a.village.localeCompare(b.village, "id"),
  );
  const target = path.join(process.cwd(), "src", "data");
  await mkdir(target, { recursive: true });
  const regencyRows = [
    ...new Map(
      rows.map((row) => [
        row.regencyCode,
        {
          code: row.regencyCode,
          name: row.regency,
          latitude: null,
          longitude: null,
        },
      ]),
    ).values(),
  ];
  const districtRows = [
    ...new Map(
      rows.map((row) => [
        row.districtCode,
        {
          code: row.districtCode,
          name: row.district,
          regencyCode: row.regencyCode,
          regencyName: row.regency,
          latitude: null,
          longitude: null,
        },
      ]),
    ).values(),
  ];
  await writeFile(
    path.join(target, "sumut-regions.json"),
    `${JSON.stringify({ metadata: { source: "Kemendagri via wilayah.id", generatedAt: new Date().toISOString(), generator: "scripts/build-sumut-adm4.ts", province: "Sumatera Utara" }, province: { code: "12", name: "Sumatera Utara" }, regencies: regencyRows, districts: districtRows, villages: rows }, null, 2)}\n`,
  );
  console.log(
    `Berhasil: ${rows.length} desa/kelurahan dari ${regencies.length} kabupaten/kota dan ${pairs.length} kecamatan.`,
  );
  console.log(
    `Gagal validasi: ${invalid.length}${invalid.length ? ` (${invalid.join(", ")})` : ""}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
