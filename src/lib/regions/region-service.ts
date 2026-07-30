import "server-only";

import regionDataset from "@/data/sumut-regions.json";
import type { RegionDataset } from "@/types/weather";
import type {
  LocationResolution,
  RegionCandidate,
  RegionLevel,
  RegionRecord,
} from "@/types/regions";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  normalizeRegionKey,
  normalizeRegionName,
  regionAliases,
  similarity,
} from "./normalizer";

type DatabaseRegion = {
  id?: string;
  province_code: string;
  province_name: string;
  regency_code: string;
  regency_name: string;
  district_code: string;
  district_name: string;
  village_code: string;
  village_name: string;
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  normalized_name: string;
  aliases: string[] | null;
  score?: number;
};

const dataset = regionDataset as RegionDataset;

const localRegions: RegionRecord[] = dataset.villages.map((region) => ({
  provinceCode: region.provinceCode,
  provinceName: region.province,
  regencyCode: region.regencyCode,
  regencyName: region.regency,
  districtCode: region.districtCode,
  districtName: region.district,
  villageCode: region.adm4,
  villageName: region.village,
  adm1: region.provinceCode,
  adm2: region.regencyCode,
  adm3: region.districtCode,
  adm4: region.adm4,
  latitude: region.latitude,
  longitude: region.longitude,
  timezone: region.timezone,
  normalizedName: normalizeRegionName(
    `${region.village} ${region.district} ${region.regency} ${region.province}`,
  ),
  aliases: regionAliases({
    regencyName: region.regency,
    districtName: region.district,
    villageName: region.village,
  }),
}));

const byAdm4 = new Map(localRegions.map((region) => [region.adm4, region]));
const byDistrict = new Map<string, RegionRecord[]>();
const byRegency = new Map<string, RegionRecord[]>();
for (const region of localRegions) {
  const district = byDistrict.get(region.districtCode) ?? [];
  district.push(region);
  byDistrict.set(region.districtCode, district);
  const regency = byRegency.get(region.regencyCode) ?? [];
  regency.push(region);
  byRegency.set(region.regencyCode, regency);
}

type Entity = {
  level: RegionLevel;
  code: string;
  name: string;
  normalized: string;
  aliases: string[];
  regions: RegionRecord[];
};

const entities: Entity[] = [];
for (const regency of dataset.regencies) {
  const regions = byRegency.get(regency.code) ?? [];
  const normalized = normalizeRegionKey(regency.name);
  entities.push({
    level: "regency",
    code: regency.code,
    name: regency.name,
    normalized,
    aliases: regionAliases({
      regencyName: regency.name,
      districtName: "",
      villageName: "",
    }),
    regions,
  });
}
for (const district of dataset.districts) {
  const regions = byDistrict.get(district.code) ?? [];
  const normalized = normalizeRegionKey(district.name);
  entities.push({
    level: "district",
    code: district.code,
    name: district.name,
    normalized,
    aliases: [normalizeRegionName(district.name), normalized],
    regions,
  });
}
const villageGroups = new Map<string, RegionRecord[]>();
for (const region of localRegions) {
  const key = normalizeRegionKey(region.villageName);
  const group = villageGroups.get(key) ?? [];
  group.push(region);
  villageGroups.set(key, group);
}
for (const [normalized, regions] of villageGroups)
  entities.push({
    level: "village",
    code: normalized,
    name: regions[0].villageName,
    normalized,
    aliases: [normalizeRegionName(regions[0].villageName), normalized],
    regions,
  });

function toCandidate(
  region: RegionRecord,
  options: {
    level?: RegionLevel;
    score?: number;
    matchedBy?: RegionCandidate["matchedBy"];
  } = {},
): RegionCandidate {
  const level = options.level ?? "village";
  return {
    ...region,
    level,
    label:
      level === "regency"
        ? `Ringkasan umum ${region.regencyName}`
        : level === "district"
          ? `Kecamatan ${region.districtName}, ${region.regencyName}`
          : `${region.villageName}, Kecamatan ${region.districtName}, ${region.regencyName}`,
    score: options.score ?? 1,
    matchedBy: options.matchedBy ?? "exact",
  };
}

function fromDatabase(row: DatabaseRegion): RegionCandidate {
  return toCandidate(
    {
      id: row.id,
      provinceCode: row.province_code,
      provinceName: row.province_name,
      regencyCode: row.regency_code,
      regencyName: row.regency_name,
      districtCode: row.district_code,
      districtName: row.district_name,
      villageCode: row.village_code,
      villageName: row.village_name,
      adm1: row.adm1,
      adm2: row.adm2,
      adm3: row.adm3,
      adm4: row.adm4,
      latitude: row.latitude,
      longitude: row.longitude,
      timezone: row.timezone,
      normalizedName: row.normalized_name,
      aliases: row.aliases ?? [],
    },
    { score: row.score ?? 1, matchedBy: "fuzzy" },
  );
}

function localSearch(query: string, limit: number) {
  const normalized = normalizeRegionKey(query);
  if (!normalized) return [];
  return localRegions
    .map((region) => {
      const fields = [
        region.villageName,
        region.districtName,
        region.regencyName,
        region.normalizedName,
        ...region.aliases,
      ];
      const scores = fields.map((field) => similarity(normalized, field));
      const exact = fields.some(
        (field) => normalizeRegionKey(field) === normalized,
      );
      const alias = region.aliases.some(
        (field) => normalizeRegionKey(field) === normalized,
      );
      return toCandidate(region, {
        score: Math.max(...scores),
        matchedBy: exact ? (alias ? "alias" : "exact") : "fuzzy",
      });
    })
    .filter((candidate) => candidate.score >= 0.58)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.label.localeCompare(b.label, "id", { sensitivity: "base" }),
    )
    .slice(0, limit);
}

export async function searchRegionCandidates(query: string, limit = 10) {
  const normalized = normalizeRegionKey(query);
  if (!normalized) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc("search_regions", {
      search_query: normalized,
      result_limit: Math.min(Math.max(limit, 1), 30),
    });
    if (!error && Array.isArray(data))
      return (data as DatabaseRegion[]).map(fromDatabase);
    if (error)
      console.error("Region search Supabase gagal:", error.code ?? "unknown");
  }
  return localSearch(normalized, limit);
}

export function getRegionByAdm4(adm4: string) {
  const region = byAdm4.get(adm4);
  return region ? toCandidate(region) : null;
}

function containsPhrase(text: string, phrase: string) {
  return new RegExp(
    `(?:^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`,
  ).test(text);
}

function explicitEntities(message: string) {
  const normalizedMessage = normalizeRegionName(message);
  return entities
    .filter((entity) => {
      if (entity.normalized.length < 4) return false;
      return [entity.normalized, ...entity.aliases]
        .filter((value) => value.length >= 4)
        .some((value) => containsPhrase(normalizedMessage, value));
    })
    .sort(
      (a, b) =>
        b.normalized.length - a.normalized.length ||
        (a.level === "village" ? -1 : b.level === "village" ? 1 : 0),
    );
}

const LOCATION_END =
  /\b(?:hari ini|sekarang|saat ini|nanti|besok|lusa|pagi|siang|sore|malam|dini hari|bagaimana|gimana|berapa|apakah|aman|hujan|suhu|temperatur|kelembapan|angin|jarak pandang|tutupan awan|kencang|tiga hari)\b.*$/;

export function extractLocationHint(message: string) {
  const normalized = normalizeRegionName(message);
  const match = normalized.match(/\b(?:di|daerah|wilayah)\s+(.+)$/);
  if (!match) return "";
  return match[1].replace(LOCATION_END, "").trim();
}

function broadCandidates(entity: Entity, limit = 60) {
  const unique = new Map<string, RegionRecord>();
  for (const region of entity.regions) {
    if (entity.level === "regency") {
      if (!unique.has(region.districtCode))
        unique.set(region.districtCode, region);
    } else unique.set(region.adm4, region);
  }
  const detailCandidates = [...unique.values()].slice(0, limit).map((region) =>
    toCandidate(region, {
      level: entity.level === "regency" ? "district" : "village",
      score: 1,
      matchedBy: "context",
    }),
  );
  if (entity.level !== "regency" || !entity.regions[0]) return detailCandidates;
  return [
    toCandidate(entity.regions[0], {
      level: "regency",
      score: 1,
      matchedBy: "context",
    }),
    ...detailCandidates,
  ];
}

function wantsGeneralSummary(message: string) {
  const normalized = normalizeRegionName(message);
  return /\b(?:aja|saja|umum|secara umum|keseluruhan|seluruh kabupaten|seluruh kota)\b/.test(
    normalized,
  );
}

function evenlySpaced<T>(values: T[], limit: number) {
  if (values.length <= limit) return values;
  if (limit <= 1) return values.slice(0, 1);
  return Array.from(
    { length: limit },
    (_, index) =>
      values[Math.round((index * (values.length - 1)) / (limit - 1))],
  );
}

export function getRepresentativeRegionsForRegency(
  regencyCode: string,
  limit = 5,
) {
  const grouped = new Map<string, RegionRecord[]>();
  for (const region of byRegency.get(regencyCode) ?? []) {
    const values = grouped.get(region.districtCode) ?? [];
    values.push(region);
    grouped.set(region.districtCode, values);
  }
  const representatives = [...grouped.values()]
    .map((values) => {
      const sorted = [...values].sort((left, right) =>
        left.villageName.localeCompare(right.villageName, "id", {
          sensitivity: "base",
        }),
      );
      return sorted[Math.floor((sorted.length - 1) / 2)];
    })
    .sort((left, right) =>
      left.districtName.localeCompare(right.districtName, "id", {
        sensitivity: "base",
      }),
    );
  return evenlySpaced(representatives, Math.max(1, Math.min(limit, 8))).map(
    (region) =>
      toCandidate(region, {
        level: "village",
        score: 1,
        matchedBy: "context",
      }),
  );
}

export function getVillageCandidatesForDistrict(
  districtCode: string,
  limit = 60,
) {
  return [...(byDistrict.get(districtCode) ?? [])]
    .sort((left, right) =>
      left.villageName.localeCompare(right.villageName, "id", {
        sensitivity: "base",
      }),
    )
    .slice(0, limit)
    .map((region) =>
      toCandidate(region, {
        level: "village",
        score: 1,
        matchedBy: "context",
      }),
    );
}

function ambiguityMessage(name: string, candidates: RegionCandidate[]) {
  return `Saya menemukan beberapa pilihan untuk ${name}. Pilih desa/kelurahan yang dimaksud agar data cuaca tidak tertukar.${candidates.length >= 8 ? " Anda juga dapat mengetik nama desa/kelurahan yang lebih spesifik." : ""}`;
}

export async function resolveLocation(
  message: string,
  previousRegion?: RegionCandidate | null,
): Promise<LocationResolution> {
  const explicit = explicitEntities(message);
  const best = explicit[0];
  if (best) {
    const sameLength = explicit.filter(
      (entity) =>
        entity.level === best.level &&
        entity.normalized.length === best.normalized.length &&
        entity.normalized === best.normalized,
    );
    const matchedRegions = [
      ...new Map(
        sameLength
          .flatMap((entity) => entity.regions)
          .map((region) => [region.adm4, region]),
      ).values(),
    ];
    if (best.level === "village") {
      const candidates = matchedRegions.map((region) => toCandidate(region));
      if (candidates.length === 1)
        return {
          status: "resolved",
          region: candidates[0],
          candidates: [],
          message: null,
        };
      return {
        status: "ambiguous",
        region: null,
        candidates: candidates.slice(0, 10),
        message: ambiguityMessage(best.name, candidates),
      };
    }
    if (best.level === "regency" && wantsGeneralSummary(message)) {
      const representative = best.regions[0];
      if (representative)
        return {
          status: "resolved",
          region: toCandidate(representative, {
            level: "regency",
            score: 1,
            matchedBy: "context",
          }),
          candidates: [],
          message: null,
        };
    }
    const candidates = broadCandidates(best);
    return {
      status: "ambiguous",
      region: null,
      candidates,
      message:
        best.level === "regency"
          ? `Pilih Ringkasan umum untuk melihat gambaran ${best.name}, atau pilih kecamatan terlebih dahulu lalu desa/kelurahan untuk mendapatkan prakiraan BMKG yang lebih spesifik.`
          : `Kecamatan ${best.name} masih mencakup beberapa desa/kelurahan. Pilih desa/kelurahan untuk mendapatkan kode ADM4 dan prakiraan BMKG yang tepat.`,
    };
  }

  const hint = extractLocationHint(message);
  if (hint) {
    const candidates = await searchRegionCandidates(hint, 10);
    if (candidates.length) {
      const bestScore = candidates[0].score;
      const close = candidates.filter(
        (candidate) => candidate.score >= Math.max(0.62, bestScore - 0.05),
      );
      if (close.length === 1)
        return {
          status: "resolved",
          region: close[0],
          candidates: [],
          message: null,
        };
      return {
        status: "ambiguous",
        region: null,
        candidates: close,
        message: ambiguityMessage(hint, close),
      };
    }
    return {
      status: "not_found",
      region: null,
      candidates: [],
      message:
        "Daerah tersebut belum ditemukan. Coba masukkan nama kecamatan, kelurahan, atau desa di Sumatera Utara.",
    };
  }

  if (previousRegion)
    return {
      status: "resolved",
      region: previousRegion,
      candidates: [],
      message: null,
    };
  return {
    status: "missing",
    region: null,
    candidates: [],
    message:
      "Sebutkan nama daerah terlebih dahulu, misalnya Kabanjahe, Medan Johor, atau Kelurahan Lau Cimba.",
  };
}

export function allLocalRegionRows() {
  return localRegions;
}
