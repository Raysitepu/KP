import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL?.trim();
const secret =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !secret)
  throw new Error(
    "SUPABASE_URL dan SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY wajib diisi.",
  );

const client = createClient(url, secret, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function tableCheck(table: string, probeColumn: string) {
  const { data, error } = await client.from(table).select(probeColumn).limit(1);
  return {
    name: table,
    ready: !error,
    hasData: Boolean(data?.length),
    code: error?.code ?? null,
  };
}

async function main() {
  const tables = await Promise.all([
    tableCheck("regions", "adm4"),
    tableCheck("administrative_regions", "adm4"),
    tableCheck("weather_cache", "adm4"),
    tableCheck("weather_alert_cache", "alert_id"),
    tableCheck("weather_conversations", "id"),
    tableCheck("geocoding_cache", "cache_key"),
  ]);

  const { error: rpcError } = await client.rpc("find_adm4_by_coordinate", {
    input_lat: -6.1754,
    input_lng: 106.8272,
  });
  const rpcReady = !rpcError;
  const projectRef = new URL(url!).hostname.split(".")[0];

  console.log(`Project Supabase: ${projectRef}`);
  for (const table of tables)
    console.log(
      `${table.ready ? "OK" : "MISSING"} ${table.name} (${table.hasData ? "berisi data" : "belum berisi data"}${table.code ? `, ${table.code}` : ""})`,
    );
  console.log(
    `${rpcReady ? "OK" : "MISSING"} RPC find_adm4_by_coordinate${rpcError?.code ? ` (${rpcError.code})` : ""}`,
  );

  if (tables.some((table) => !table.ready) || !rpcReady) {
    console.error(
      "Database belum lengkap. Jalankan kedua migration di supabase/migrations terlebih dahulu.",
    );
    process.exitCode = 1;
  } else if (
    !tables.find((table) => table.name === "administrative_regions")?.hasData
  ) {
    console.warn(
      "Schema siap, tetapi polygon ADM4 nasional belum diimpor. Jalankan npm run data:import:polygons.",
    );
  } else {
    console.log("Database rute-cuaca siap digunakan.");
  }
}

void main();
