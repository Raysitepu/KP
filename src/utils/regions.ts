import type { Region } from "@/types/weather";

export const normalizeSearch = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");

export function searchRegions(regions: Region[], query: string, limit = 20) {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  if (!terms.length) return regions.slice(0, limit);
  return regions
    .filter((region) => {
      const haystack = normalizeSearch(
        `${region.village} ${region.district} ${region.regency} ${region.adm4}`,
      );
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, limit);
}
