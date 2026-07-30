import "server-only";

import { getWeather } from "@/services/bmkg-weather.service";
import type { WeatherResponse } from "@/types/weather";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { TtlCache, WEATHER_CACHE_MS } from "./cache";

const memory = new TtlCache<WeatherResponse>();

export async function getCachedWeather(adm4: string, forceRefresh = false) {
  const cached = forceRefresh ? null : memory.get(adm4);
  if (cached) return cached;

  const supabase = getSupabaseAdmin();
  if (supabase && !forceRefresh) {
    const { data, error } = await supabase
      .from("weather_cache")
      .select("response_data, expires_at")
      .eq("adm4", adm4)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!error && data?.response_data) {
      const value = data.response_data as WeatherResponse;
      const ttl = Math.max(
        1_000,
        new Date(data.expires_at as string).getTime() - Date.now(),
      );
      memory.set(adm4, value, ttl);
      return value;
    }
    if (error)
      console.error("Weather cache Supabase gagal dibaca:", error.code);
  }

  const weather = await getWeather(adm4, 0, forceRefresh);
  memory.set(adm4, weather, WEATHER_CACHE_MS);
  if (supabase) {
    const expiresAt = new Date(Date.now() + WEATHER_CACHE_MS).toISOString();
    const { error } = await supabase.from("weather_cache").upsert(
      {
        adm4,
        response_data: weather,
        fetched_at: weather.fetchedAt,
        expires_at: expiresAt,
      },
      { onConflict: "adm4" },
    );
    if (error)
      console.error("Weather cache Supabase gagal disimpan:", error.code);
  }
  return weather;
}

export const getWeatherByAdm4 = getCachedWeather;

export async function getCachedWeatherWithMetadata(adm4: string) {
  try {
    return { weather: await getCachedWeather(adm4), stale: false };
  } catch (error) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error: cacheError } = await supabase
        .from("weather_cache")
        .select("response_data")
        .eq("adm4", adm4)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cacheError && data?.response_data)
        return {
          weather: data.response_data as WeatherResponse,
          stale: true,
        };
    }
    throw error;
  }
}
