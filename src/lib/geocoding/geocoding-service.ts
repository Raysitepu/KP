import "server-only";

import { z } from "zod";
import type { LocationSearchResult } from "@/types/route";
import { ServiceError } from "@/services/fetch-json";
import {
  GEOCODING_CACHE_MS,
  geocodingReverseCache,
  geocodingSearchCache,
} from "./geocoding-cache";

const nominatimItemSchema = z
  .object({
    place_id: z.union([z.string(), z.number()]),
    display_name: z.string(),
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    type: z.string().optional().default("place"),
  })
  .passthrough();

const photonFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
  properties: z
    .object({
      name: z.string().optional(),
      street: z.string().optional(),
      housenumber: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      osm_type: z.string().optional(),
      osm_id: z.union([z.string(), z.number()]).optional(),
      osm_value: z.string().optional(),
    })
    .passthrough(),
});

const photonResponseSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(photonFeatureSchema),
});

type Provider = "photon" | "nominatim";

function provider(): Provider {
  return process.env.GEOCODING_PROVIDER === "nominatim"
    ? "nominatim"
    : "photon";
}

function providerBase(value: Provider) {
  return (
    process.env.GEOCODING_BASE_URL ??
    (value === "photon"
      ? "https://photon.komoot.io"
      : "https://nominatim.openstreetmap.org")
  ).replace(/\/$/, "");
}

async function geocodingFetch(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "id",
        "User-Agent":
          process.env.GEOCODING_USER_AGENT ??
          "BBMKG-RouteWeather/1.0 (contact: admin@example.invalid)",
      },
      cache: "no-store",
    });
    if (!response.ok)
      throw new ServiceError(
        "GEOCODING_UPSTREAM_ERROR",
        "Layanan pencarian lokasi sedang bermasalah.",
      );
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (controller.signal.aborted)
      throw new ServiceError(
        "GEOCODING_TIMEOUT",
        "Pencarian lokasi terlalu lama merespons.",
        504,
      );
    throw new ServiceError(
      "GEOCODING_NETWORK_ERROR",
      "Layanan pencarian lokasi belum dapat dihubungi.",
    );
  } finally {
    clearTimeout(timer);
  }
}

function normalizeNominatim(
  item: z.infer<typeof nominatimItemSchema>,
): LocationSearchResult {
  return {
    id: String(item.place_id),
    displayName: item.display_name,
    latitude: item.lat,
    longitude: item.lon,
    type: item.type,
  };
}

function normalizePhoton(
  item: z.infer<typeof photonFeatureSchema>,
): LocationSearchResult {
  const properties = item.properties;
  const address = [
    properties.name,
    [properties.street, properties.housenumber].filter(Boolean).join(" "),
    properties.district,
    properties.city,
    properties.county,
    properties.state,
    properties.country,
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  const [longitude, latitude] = item.geometry.coordinates;
  return {
    id:
      properties.osm_id != null
        ? `${properties.osm_type ?? "osm"}-${properties.osm_id}`
        : `${latitude},${longitude}`,
    displayName: address.join(", ") || `${latitude}, ${longitude}`,
    latitude,
    longitude,
    type: properties.osm_value ?? "place",
  };
}

async function searchWithNominatim(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "id",
    limit: "6",
  });
  const parsed = z
    .array(nominatimItemSchema)
    .safeParse(
      await geocodingFetch(`${providerBase("nominatim")}/search?${params}`),
    );
  if (!parsed.success) throw new Error("invalid geocoding response");
  return parsed.data.map(normalizeNominatim);
}

async function searchWithPhoton(query: string) {
  const params = new URLSearchParams({
    q: query,
    countrycode: "id",
    limit: "6",
  });
  const parsed = photonResponseSchema.safeParse(
    await geocodingFetch(`${providerBase("photon")}/api/?${params}`),
  );
  if (!parsed.success) throw new Error("invalid geocoding response");
  return parsed.data.features.map(normalizePhoton);
}

export async function searchIndonesiaLocations(query: string) {
  const selectedProvider = provider();
  const key = `${selectedProvider}:${query.toLocaleLowerCase("id-ID")}`;
  const cached = geocodingSearchCache.get(key);
  if (cached) return cached;
  try {
    const results =
      selectedProvider === "nominatim"
        ? await searchWithNominatim(query)
        : await searchWithPhoton(query);
    geocodingSearchCache.set(key, results, GEOCODING_CACHE_MS);
    return results;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      "INVALID_GEOCODING_RESPONSE",
      "Hasil pencarian lokasi tidak valid.",
    );
  }
}

async function reverseWithNominatim(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "16",
  });
  const parsed = nominatimItemSchema.safeParse(
    await geocodingFetch(`${providerBase("nominatim")}/reverse?${params}`),
  );
  return parsed.success ? normalizeNominatim(parsed.data) : null;
}

async function reverseWithPhoton(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    limit: "1",
  });
  const parsed = photonResponseSchema.safeParse(
    await geocodingFetch(`${providerBase("photon")}/reverse?${params}`),
  );
  return parsed.success && parsed.data.features[0]
    ? normalizePhoton(parsed.data.features[0])
    : null;
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const selectedProvider = provider();
  const key = `${selectedProvider}:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = geocodingReverseCache.get(key);
  if (cached) return cached;
  const result =
    selectedProvider === "nominatim"
      ? await reverseWithNominatim(latitude, longitude)
      : await reverseWithPhoton(latitude, longitude);
  if (!result)
    throw new ServiceError(
      "LOCATION_NOT_FOUND",
      "Nama lokasi pada koordinat tersebut belum ditemukan.",
      404,
    );
  geocodingReverseCache.set(key, result, GEOCODING_CACHE_MS);
  return result;
}
