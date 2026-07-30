"use client";

import type { RouteResult, RouteWeatherResponse } from "@/types/route";

export async function fetchRouteWeather(
  route: RouteResult,
  departureTime: string,
) {
  const response = await fetch("/api/routes/weather", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routeGeometry: route.geometry,
      totalDistanceMeters: route.distanceMeters,
      totalDurationSeconds: route.durationSeconds,
      departureTime,
    }),
  });
  const body = (await response.json()) as Partial<RouteWeatherResponse> & {
    message?: string;
  };
  if (!response.ok || !body.success)
    throw new Error(
      body.message ?? "Cuaca sepanjang rute belum dapat diproses.",
    );
  return body as RouteWeatherResponse;
}
