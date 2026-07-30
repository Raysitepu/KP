import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const ORIGIN = "https://www.bmkg.go.id";
const ROOT = `${ORIGIN}/cuaca/prakiraan-cuaca/12`;
const USER_AGENT = `SumutWeatherDashboard-RegionBuilder/1.0 Academic Project - Contact: ${process.env.EMAIL_PROJECT ?? "not-configured"}`;
const CACHE_DIR = path.join(process.cwd(), ".cache", "bmkg-regions");
const CHECKPOINT = path.join(CACHE_DIR, "checkpoint.json");
const OUTPUT = path.join(process.cwd(), "src", "data", "sumut-regions.json");
const REGENCY = /^\/cuaca\/prakiraan-cuaca\/(12\.\d{2})$/;
const DISTRICT = /^\/cuaca\/prakiraan-cuaca\/(12\.\d{2}\.\d{2})$/;
const VILLAGE = /^\/cuaca\/prakiraan-cuaca\/(12\.\d{2}\.\d{2}\.\d{4})$/;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type Link = { code: string; name: string; url: string };
type Region = {
  provinceCode: string;
  regencyCode: string;
  districtCode: string;
  adm4: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  bmkgPageName: string;
  label: string;
  searchText: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  bmkgPageUrl: string;
  validationStatus: "valid" | "pending";
};
type Checkpoint = {
  completedDistricts: string[];
  rows: Region[];
  failedPages: string[];
  duplicatesRemoved?: number;
};
let lastRequestAt = 0;

async function atomicJson(file: string, value: unknown) {
  const temp = `${file}.${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temp, file);
}
async function cachedFetch(url: string, retry = 0): Promise<string> {
  if (!url.startsWith(ORIGIN + "/"))
    throw new Error(`Domain tidak diizinkan: ${url}`);
  const cacheFile = path.join(
    CACHE_DIR,
    `${createHash("sha1").update(url).digest("hex")}.html`,
  );
  try {
    return await readFile(cacheFile, "utf8");
  } catch {}
  const wait = Math.max(
    0,
    500 + Math.floor(Math.random() * 301) - (Date.now() - lastRequestAt),
  );
  if (wait) await sleep(wait);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  lastRequestAt = Date.now();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
    });
    if (response.status === 404) throw new Error(`HTTP 404: ${url}`);
    if (response.status === 429 || response.status >= 500) {
      if (retry < 2) {
        await sleep(1000 * 2 ** retry);
        return cachedFetch(url, retry + 1);
      }
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    const html = await response.text();
    await writeFile(cacheFile, html);
    return html;
  } catch (error) {
    if (retry < 2 && error instanceof Error && error.name === "AbortError") {
      await sleep(1000 * 2 ** retry);
      return cachedFetch(url, retry + 1);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function links(html: string, pattern: RegExp): Link[] {
  const $ = cheerio.load(html);
  const result = new Map<string, Link>();
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();
    if (!href) return;
    let parsed: URL;
    try {
      parsed = new URL(href, ORIGIN);
    } catch {
      return;
    }
    if (parsed.origin !== ORIGIN) return;
    const match = parsed.pathname.match(pattern);
    const name = $(element).text().replace(/\s+/g, " ").trim();
    if (match && name)
      result.set(match[1], {
        code: match[1],
        name,
        url: `${ORIGIN}${parsed.pathname}`,
      });
  });
  return [...result.values()].sort((a, b) => a.code.localeCompare(b.code));
}

async function assertRobotsAllowed() {
  const text = await (
    await fetch(`${ORIGIN}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
    })
  ).text();
  const generic =
    text
      .split(/user-agent:/i)
      .find((section) => section.trim().startsWith("*")) ?? "";
  const disallows = [...generic.matchAll(/disallow:\s*(\S+)/gi)].map(
    (match) => match[1],
  );
  if (
    disallows.some(
      (rule) => rule === "/" || "/cuaca/prakiraan-cuaca/12".startsWith(rule),
    )
  )
    throw new Error(
      "robots.txt melarang crawler pada halaman prakiraan. Gunakan generator Kemendagri sebagai fallback.",
    );
}

async function loadCheckpoint(): Promise<Checkpoint> {
  try {
    return JSON.parse(await readFile(CHECKPOINT, "utf8")) as Checkpoint;
  } catch {
    return { completedDistricts: [], rows: [], failedPages: [] };
  }
}
async function mapTwo<T, R>(items: T[], fn: (item: T) => Promise<R>) {
  let cursor = 0;
  const output = new Array<R>(items.length);
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await fn(items[index]);
    }
  }
  await Promise.all([worker(), worker()]);
  return output;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await assertRobotsAllowed();
  const checkpoint = await loadCheckpoint();
  const completed = new Set(checkpoint.completedDistricts);
  const rowMap = new Map(checkpoint.rows.map((row) => [row.adm4, row]));
  const failed = new Set(checkpoint.failedPages);
  let duplicatesRemoved = checkpoint.duplicatesRemoved ?? 0;
  const regencies = links(await cachedFetch(ROOT), REGENCY);
  const districtGroups = await mapTwo(regencies, async (regency) => ({
    regency,
    districts: links(await cachedFetch(regency.url), DISTRICT),
  }));
  const tasks = districtGroups.flatMap(({ regency, districts }) =>
    districts.map((district) => ({ regency, district })),
  );
  let done = completed.size;
  await mapTwo(
    tasks.filter(({ district }) => !completed.has(district.code)),
    async ({ regency, district }) => {
      try {
        const villages = links(await cachedFetch(district.url), VILLAGE);
        for (const village of villages) {
          const villageName = village.name;
          if (rowMap.has(village.code)) duplicatesRemoved++;
          rowMap.set(village.code, {
            provinceCode: "12",
            regencyCode: regency.code,
            districtCode: district.code,
            adm4: village.code,
            province: "Sumatera Utara",
            regency: regency.name,
            district: district.name,
            village: villageName,
            bmkgPageName: villageName,
            label: `${villageName}, ${district.name}, ${regency.name}`,
            searchText:
              `${villageName} ${district.name} ${regency.name} Sumatera Utara`.toLocaleLowerCase(
                "id-ID",
              ),
            latitude: null,
            longitude: null,
            timezone: "Asia/Jakarta",
            bmkgPageUrl: village.url,
            validationStatus: "pending",
          });
        }
        completed.add(district.code);
        done++;
        console.log(
          `[${done}/${tasks.length}] ${district.code} ${district.name}: ${villages.length} wilayah`,
        );
      } catch (error) {
        failed.add(district.url);
        console.error(
          `Gagal ${district.url}: ${error instanceof Error ? error.message : error}`,
        );
      }
      await atomicJson(CHECKPOINT, {
        completedDistricts: [...completed],
        rows: [...rowMap.values()],
        failedPages: [...failed],
        duplicatesRemoved,
      });
    },
  );
  const rows = [...rowMap.values()]
    .filter(
      (row) =>
        VILLAGE.test(`/cuaca/prakiraan-cuaca/${row.adm4}`) &&
        row.adm4.startsWith(`${row.districtCode}.`),
    )
    .sort(
      (a, b) =>
        a.regency.localeCompare(b.regency, "id") ||
        a.district.localeCompare(b.district, "id") ||
        a.village.localeCompare(b.village, "id"),
    );
  const output = {
    metadata: {
      source: "BMKG",
      generatedAt: new Date().toISOString(),
      generator: "scripts/build-sumut-regions.ts",
      province: "Sumatera Utara",
    },
    province: { code: "12", name: "Sumatera Utara" },
    regencies: regencies.map((item) => ({
      code: item.code,
      name: item.name,
      latitude: null,
      longitude: null,
    })),
    districts: tasks.map(({ regency, district }) => ({
      code: district.code,
      name: district.name,
      regencyCode: regency.code,
      regencyName: regency.name,
      latitude: null,
      longitude: null,
    })),
    villages: rows,
  };
  await atomicJson(OUTPUT, output);
  console.log("\nSumatera Utara region generation completed.");
  console.log(`Kabupaten/Kota : ${regencies.length}`);
  console.log(`Kecamatan      : ${tasks.length}`);
  console.log(`Desa/Kelurahan : ${rows.length}`);
  console.log(`Valid ADM4     : ${rows.length}`);
  console.log(
    `API valid      : ${rows.filter((row) => row.validationStatus === "valid").length}`,
  );
  console.log(
    `Pending        : ${rows.filter((row) => row.validationStatus === "pending").length}`,
  );
  console.log(`Duplikat       : ${duplicatesRemoved}`);
  console.log(`Halaman gagal  : ${failed.size}`);
  console.log(`Output         : ${path.relative(process.cwd(), OUTPUT)}`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
