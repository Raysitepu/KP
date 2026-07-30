import { z } from "zod";

export const coordinateSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

const coordinateTupleSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);

export const routeGeometrySchema = z.object({
  type: z.literal("LineString"),
  coordinates: z
    .array(coordinateTupleSchema)
    .min(2)
    .max(5_000, "Geometri rute terlalu kompleks."),
});

const departureTimeSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(new Date(value).getTime()), {
    message: "Waktu keberangkatan tidak valid.",
  });

export const calculateRouteRequestSchema = z
  .object({
    origin: coordinateSchema,
    destination: coordinateSchema,
    departureTime: departureTimeSchema,
    profile: z.literal("driving").default("driving"),
  })
  .refine(
    ({ origin, destination }) =>
      Math.abs(origin.latitude - destination.latitude) > 0.00001 ||
      Math.abs(origin.longitude - destination.longitude) > 0.00001,
    { message: "Lokasi awal dan tujuan tidak boleh sama." },
  );

export const routeWeatherRequestSchema = z.object({
  routeGeometry: routeGeometrySchema,
  totalDistanceMeters: z.number().finite().positive().max(3_000_000),
  totalDurationSeconds: z.number().finite().positive().max(259_200),
  departureTime: departureTimeSchema,
});

export const locationQuerySchema = z.string().trim().min(3).max(120);

export function parseCoordinateQuery(url: string) {
  const params = new URL(url).searchParams;
  return coordinateSchema.safeParse({
    latitude: Number(params.get("lat")),
    longitude: Number(params.get("lng")),
  });
}

export function sanitizeLocationQuery(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
