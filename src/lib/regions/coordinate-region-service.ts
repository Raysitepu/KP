import "server-only";

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdministrativeRegion, Coordinate } from "@/types/route";

const resultSchema = z.object({
  adm1: z.string().nullable().optional(),
  adm2: z.string().nullable().optional(),
  adm3: z.string().nullable().optional(),
  adm4: z.string().min(1),
  province_name: z.string(),
  regency_name: z.string(),
  district_name: z.string(),
  village_name: z.string(),
  timezone: z.string(),
});

function normalize(
  value: z.infer<typeof resultSchema>,
  matchedBy: AdministrativeRegion["matchedBy"],
): AdministrativeRegion {
  return {
    adm1: value.adm1 ?? null,
    adm2: value.adm2 ?? null,
    adm3: value.adm3 ?? null,
    adm4: value.adm4,
    provinceName: value.province_name,
    regencyName: value.regency_name,
    districtName: value.district_name,
    villageName: value.village_name,
    timezone: value.timezone,
    matchedBy,
  };
}

async function callResolver(
  fn: "find_adm4_by_coordinate" | "find_nearest_adm4_by_coordinate",
  coordinate: Coordinate,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(fn, {
    input_lat: coordinate.latitude,
    input_lng: coordinate.longitude,
  });
  if (error) {
    console.error(`RPC ${fn} gagal:`, error.code);
    return null;
  }
  const parsed = z.array(resultSchema).safeParse(data);
  return parsed.success && parsed.data.length ? parsed.data[0] : null;
}

export async function findRegionByCoordinate(coordinate: Coordinate) {
  const covered = await callResolver("find_adm4_by_coordinate", coordinate);
  if (covered) return normalize(covered, "polygon");
  const nearest = await callResolver(
    "find_nearest_adm4_by_coordinate",
    coordinate,
  );
  return nearest ? normalize(nearest, "centroid") : null;
}
