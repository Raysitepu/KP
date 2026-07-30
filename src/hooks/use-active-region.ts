"use client";

import { useEffect, useState } from "react";
import regionDataset from "@/data/sumut-regions.json";
import type { Region, RegionDataset } from "@/types/weather";

export const regions = (regionDataset as RegionDataset).villages;
export const defaultRegion =
  regions.find((region) => region.adm4 === "12.71.03.1001") ?? regions[0];

const STORAGE_KEY = "bmkg-sumut:last-region";

export function useActiveRegion() {
  const [region, setRegion] = useState(defaultRegion);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const storedRegion = regions.find((item) => item.adm4 === saved);
        if (storedRegion) setRegion(storedRegion);
      } catch {}
    });
  }, []);

  const selectRegion = (nextRegion: Region) => {
    setRegion(nextRegion);
    try {
      localStorage.setItem(STORAGE_KEY, nextRegion.adm4);
    } catch {}
  };

  return { region, selectRegion, regions };
}
