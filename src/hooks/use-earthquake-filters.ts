"use client";

import { useMemo, useState } from "react";
import { useEarthquakes } from "@/hooks/use-earthquakes";
import type { Earthquake } from "@/types/earthquake";
import type { EarthquakeType } from "@/services/bmkg-earthquake.service";
import { haversineKm } from "@/utils/earthquake";

export type EarthquakeRadius = "all" | 100 | 250 | 500;
export type FilteredEarthquake = Earthquake & { distanceKm: number | null };

export function filterEarthquakes(
  items: Earthquake[],
  options: {
    radius: EarthquakeRadius;
    minMagnitude: number;
    maxMagnitude: number;
    center?: { latitude: number | null; longitude: number | null };
  },
) {
  return items.flatMap<FilteredEarthquake>((item) => {
    if (
      item.magnitude != null &&
      (item.magnitude < options.minMagnitude ||
        item.magnitude > options.maxMagnitude)
    )
      return [];
    if (options.radius === "all") return [{ ...item, distanceKm: null }];
    if (
      options.center?.latitude == null ||
      options.center.longitude == null ||
      item.latitude == null ||
      item.longitude == null
    )
      return [];
    const distanceKm = haversineKm(
      options.center.latitude,
      options.center.longitude,
      item.latitude,
      item.longitude,
    );
    return distanceKm <= options.radius ? [{ ...item, distanceKm }] : [];
  });
}

export function useEarthquakeFilters(center?: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [type, setType] = useState<EarthquakeType>("latest");
  const [radius, setRadius] = useState<EarthquakeRadius>("all");
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [maxMagnitude, setMaxMagnitude] = useState(10);
  const query = useEarthquakes(type);
  const items = useMemo(
    () =>
      filterEarthquakes(query.data?.items ?? [], {
        radius,
        minMagnitude,
        maxMagnitude,
        center,
      }),
    [query.data?.items, radius, minMagnitude, maxMagnitude, center],
  );
  const description =
    radius === "all"
      ? `${type === "m5" ? "Gempa M5+" : type === "felt" ? "Gempa dirasakan" : "Gempa terbaru"} Indonesia`
      : `Gempa dalam radius ${radius} km dari wilayah aktif`;
  return {
    type,
    setType,
    radius,
    setRadius,
    minMagnitude,
    setMinMagnitude,
    maxMagnitude,
    setMaxMagnitude,
    query,
    items,
    description,
  };
}
