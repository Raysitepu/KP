import "server-only";

import { z } from "zod";
import type { Coordinate, RouteResult, RouteStep } from "@/types/route";
import { fetchJson, ServiceError } from "@/services/fetch-json";

const maneuverSchema = z
  .object({
    type: z.string().optional().default("continue"),
    modifier: z.string().optional(),
  })
  .passthrough();

const osrmStepSchema = z
  .object({
    distance: z.number().nonnegative(),
    duration: z.number().nonnegative(),
    name: z.string().optional().default(""),
    mode: z.string().optional().default("driving"),
    maneuver: maneuverSchema,
  })
  .passthrough();

const osrmResponseSchema = z
  .object({
    code: z.string(),
    message: z.string().optional(),
    routes: z
      .array(
        z
          .object({
            distance: z.number().positive(),
            duration: z.number().positive(),
            geometry: z.object({
              type: z.literal("LineString"),
              coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
            }),
            legs: z
              .array(
                z
                  .object({ steps: z.array(osrmStepSchema).default([]) })
                  .passthrough(),
              )
              .default([]),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

function instruction(step: z.infer<typeof osrmStepSchema>) {
  const road = step.name ? ` ke ${step.name}` : "";
  const modifier = step.maneuver.modifier
    ? ` (${step.maneuver.modifier.replaceAll("_", " ")})`
    : "";
  const labels: Record<string, string> = {
    depart: "Mulai perjalanan",
    arrive: "Tiba di tujuan",
    turn: "Belok",
    continue: "Lanjutkan",
    merge: "Bergabung ke jalan",
    fork: "Ambil percabangan",
    roundabout: "Masuk bundaran",
    "exit roundabout": "Keluar bundaran",
    "new name": "Lanjut ke jalan",
    end: "Lanjutkan",
  };
  return `${labels[step.maneuver.type] ?? "Lanjutkan"}${road}${modifier}`;
}

function normalizeSteps(
  raw: z.infer<typeof osrmResponseSchema>["routes"][number],
) {
  return raw.legs.flatMap((leg) =>
    leg.steps.map((step): RouteStep => ({
      distanceMeters: step.distance,
      durationSeconds: step.duration,
      name: step.name,
      instruction: instruction(step),
      mode: step.mode,
    })),
  );
}

export async function calculateDrivingRoute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<RouteResult> {
  const base = (
    process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org"
  ).replace(/\/$/, "");
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${base}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&annotations=true`;
  const parsed = osrmResponseSchema.safeParse(
    await fetchJson(url, 15_000, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );
  if (!parsed.success)
    throw new ServiceError(
      "INVALID_OSRM_RESPONSE",
      "Respons rute tidak valid.",
    );
  if (parsed.data.code === "NoRoute" || !parsed.data.routes.length)
    throw new ServiceError(
      "NO_ROUTE",
      "Rute tidak ditemukan untuk kedua lokasi tersebut.",
      422,
    );
  if (parsed.data.code !== "Ok")
    throw new ServiceError(
      "OSRM_ERROR",
      parsed.data.message ?? "Layanan rute gagal memproses perjalanan.",
    );
  const route = parsed.data.routes[0];
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
    steps: normalizeSteps(route),
  };
}
