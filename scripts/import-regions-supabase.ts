import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import dataset from "../src/data/sumut-regions.json";
import type { RegionDataset } from "../src/types/weather";
import {
  normalizeRegionName,
  regionAliases,
} from "../src/lib/regions/normalizer";

loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL?.trim();
const secret =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !secret)
  throw new Error(
    "SUPABASE_URL dan SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY wajib diisi.",
  );

const supabase = createClient(url, secret, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const rows = (dataset as RegionDataset).villages.map((region) => ({
  province_code: region.provinceCode,
  province_name: region.province,
  regency_code: region.regencyCode,
  regency_name: region.regency,
  district_code: region.districtCode,
  district_name: region.district,
  village_code: region.adm4,
  village_name: region.village,
  adm1: region.provinceCode,
  adm2: region.regencyCode,
  adm3: region.districtCode,
  adm4: region.adm4,
  latitude: region.latitude,
  longitude: region.longitude,
  timezone: region.timezone,
  normalized_name: normalizeRegionName(
    `${region.village} ${region.district} ${region.regency} ${region.province}`,
  ),
  aliases: regionAliases({
    regencyName: region.regency,
    districtName: region.district,
    villageName: region.village,
  }),
}));

async function main() {
  const batchSize = 500;
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const { error } = await supabase
      .from("regions")
      .upsert(batch, { onConflict: "adm4" });
    if (error) throw new Error(`Import gagal: ${error.message}`);
    console.log(
      `Imported ${Math.min(start + batch.length, rows.length)}/${rows.length}`,
    );
  }

  console.log(`Selesai mengimpor ${rows.length} wilayah Sumatera Utara.`);
}

void main();
