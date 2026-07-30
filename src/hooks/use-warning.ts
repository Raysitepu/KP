"use client";
import { useQuery } from "@tanstack/react-query";
import type { WarningResponse } from "@/types/warning";
export const useWarning = () =>
  useQuery({
    queryKey: ["weather-warning", "sumatera-utara"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/warnings", { signal });
      if (!response.ok) throw new Error("warning-unavailable");
      return response.json() as Promise<WarningResponse>;
    },
    staleTime: 3 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
