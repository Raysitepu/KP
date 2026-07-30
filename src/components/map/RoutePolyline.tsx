"use client";

import { useMemo } from "react";
import { Polyline } from "react-leaflet";
import { haversineDistanceKm } from "@/lib/routing/route-sampler";
import type {
  RouteGeometry,
  RouteWeatherPoint,
  RouteWeatherStatus,
} from "@/types/route";

const colors: Record<RouteWeatherStatus, string> = {
  normal: "#16865a",
  rain: "#1687c8",
  caution: "#d97706",
  warning: "#dc2626",
  unknown: "#64748b",
};

function routeSegments(
  geometry: RouteGeometry,
  totalDistanceKm: number,
  points: RouteWeatherPoint[],
) {
  if (!points.length) return [];
  const cumulative = [0];
  for (let index = 1; index < geometry.coordinates.length; index += 1)
    cumulative.push(
      cumulative[index - 1] +
        haversineDistanceKm(
          geometry.coordinates[index - 1],
          geometry.coordinates[index],
        ),
    );
  const geometryDistance = cumulative.at(-1) ?? 1;
  const groups: {
    status: RouteWeatherStatus;
    positions: [number, number][];
  }[] = [];
  geometry.coordinates.forEach(([longitude, latitude], index) => {
    const routeDistance =
      (cumulative[index] / geometryDistance) * totalDistanceKm;
    const nearest = points.reduce((best, point) =>
      Math.abs(point.distanceFromOriginKm - routeDistance) <
      Math.abs(best.distanceFromOriginKm - routeDistance)
        ? point
        : best,
    );
    const position: [number, number] = [latitude, longitude];
    const current = groups.at(-1);
    if (!current || current.status !== nearest.status) {
      const previous = current?.positions.at(-1);
      groups.push({
        status: nearest.status,
        positions: previous ? [previous, position] : [position],
      });
    } else current.positions.push(position);
  });
  return groups.filter((group) => group.positions.length >= 2);
}

export function RoutePolyline({
  geometry,
  totalDistanceMeters,
  weatherPoints,
}: {
  geometry: RouteGeometry;
  totalDistanceMeters: number;
  weatherPoints: RouteWeatherPoint[];
}) {
  const positions = useMemo(
    () =>
      geometry.coordinates.map(
        ([longitude, latitude]) => [latitude, longitude] as [number, number],
      ),
    [geometry],
  );
  const segments = useMemo(
    () => routeSegments(geometry, totalDistanceMeters / 1_000, weatherPoints),
    [geometry, totalDistanceMeters, weatherPoints],
  );
  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9 }}
      />
      <Polyline
        positions={positions}
        pathOptions={{
          color: weatherPoints.length ? "#64748b" : "#2563eb",
          weight: 6,
          opacity: 0.95,
        }}
      />
      {segments.map((segment, index) => (
        <Polyline
          key={`${segment.status}-${index}`}
          positions={segment.positions}
          pathOptions={{
            color: colors[segment.status],
            weight: 6,
            opacity: 0.95,
          }}
        />
      ))}
    </>
  );
}
