"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { WeatherResponse } from "@/types/weather";

async function load(adm4: string, signal: AbortSignal, refresh = false) {
  const response = await fetch(
    `/api/weather?adm4=${encodeURIComponent(adm4)}${refresh ? "&refresh=1" : ""}`,
    { signal, cache: "no-store" },
  );
  const body = (await response.json()) as WeatherResponse & { error?: string };
  if (!response.ok)
    throw new Error(body.error ?? "Data cuaca belum dapat dimuat.");
  return body;
}
export const useWeather = (adm4: string) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["weather", adm4],
    queryFn: ({ signal }) => load(adm4, signal),
    enabled: Boolean(adm4),
    refetchOnMount: "always",
  });
  return {
    ...query,
    refresh: async () => {
      const data = await load(adm4, new AbortController().signal, true);
      queryClient.setQueryData(["weather", adm4], data);
      return data;
    },
  };
};
