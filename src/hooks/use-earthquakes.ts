"use client";
import { useQuery } from "@tanstack/react-query";
import type { EarthquakeResponse } from "@/types/earthquake";
import type { EarthquakeType } from "@/services/bmkg-earthquake.service";

export const useEarthquakes = (type: EarthquakeType) =>
  useQuery({
    queryKey: ["earthquakes", type],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/earthquakes?type=${type}`, { signal });
      const body = (await response.json()) as EarthquakeResponse & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error ?? "Data gempa belum dapat dimuat.");
      return body;
    },
  });
