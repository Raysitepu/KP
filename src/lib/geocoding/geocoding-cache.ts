import "server-only";

import { TtlCache } from "@/lib/bmkg/cache";
import type { LocationSearchResult } from "@/types/route";

export const geocodingSearchCache = new TtlCache<LocationSearchResult[]>();
export const geocodingReverseCache = new TtlCache<LocationSearchResult>();
export const GEOCODING_CACHE_MS = 24 * 60 * 60 * 1_000;
