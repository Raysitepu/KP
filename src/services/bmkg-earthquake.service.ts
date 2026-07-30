import { rawEarthquakeSchema } from "@/schemas/bmkg";
import type { Earthquake, EarthquakeResponse } from "@/types/earthquake";
import { parseCoordinates } from "@/utils/earthquake";
import { fetchJson, ServiceError } from "./fetch-json";

const files = {
  latest: "autogempa.json",
  m5: "gempaterkini.json",
  felt: "gempadirasakan.json",
} as const;
export type EarthquakeType = keyof typeof files;

export function normalizeEarthquakes(
  raw: unknown,
  type: EarthquakeType,
): EarthquakeResponse {
  const root = raw as { Infogempa?: { gempa?: unknown } };
  const source = root?.Infogempa?.gempa;
  const values = Array.isArray(source) ? source : source ? [source] : [];
  const items: Earthquake[] = values.flatMap((value, index) => {
    const parsed = rawEarthquakeSchema.safeParse(value);
    if (!parsed.success) return [];
    const d = parsed.data;
    const [latitude, longitude] = parseCoordinates(d.Coordinates);
    return [
      {
        id: `${d.DateTime ?? d.Tanggal}-${index}`,
        date: d.Tanggal,
        time: d.Jam,
        datetime: d.DateTime ?? null,
        latitude,
        longitude,
        magnitude: d.Magnitude == null ? null : Number(d.Magnitude),
        depth: d.Kedalaman,
        region: d.Wilayah,
        potential: d.Potensi,
        felt: d.Dirasakan ?? null,
        shakemapUrl: d.Shakemap
          ? `https://data.bmkg.go.id/DataMKG/TEWS/${d.Shakemap}`
          : null,
      },
    ];
  });
  return { type, items, fetchedAt: new Date().toISOString() };
}

export async function getEarthquakes(type: EarthquakeType) {
  if (!(type in files))
    throw new ServiceError(
      "INVALID_TYPE",
      "Jenis data gempa tidak valid.",
      400,
    );
  const base =
    process.env.BMKG_EARTHQUAKE_BASE_URL ??
    "https://data.bmkg.go.id/DataMKG/TEWS";
  return normalizeEarthquakes(
    await fetchJson(`${base}/${files[type]}`, 10_000, {
      next: { revalidate: 300 },
    }),
    type,
  );
}
