import { NextResponse } from "next/server";
import { calculateRouteRequestSchema } from "@/schemas/route";
import { calculateDrivingRoute } from "@/lib/routing/osrm-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { ServiceError } from "@/services/fetch-json";

function limitGeometry(coordinates: [number, number][], limit = 5_000) {
  if (coordinates.length <= limit) return coordinates;
  const step = Math.ceil((coordinates.length - 1) / (limit - 1));
  const reduced = coordinates.filter(
    (_, index) => index === 0 || index % step === 0,
  );
  const last = coordinates.at(-1);
  if (last && reduced.at(-1) !== last) reduced.push(last);
  return reduced.slice(0, limit);
}

export async function POST(request: Request) {
  const limit = rateLimit(requestKey(request, "route-calculate"), {
    limit: 20,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { success: false, message: "Terlalu banyak permintaan rute." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }
  const parsed = calculateRouteRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Koordinat tidak valid.",
      },
      { status: 400 },
    );
  try {
    const route = await calculateDrivingRoute(
      parsed.data.origin,
      parsed.data.destination,
    );
    const maximumDistance = Number(
      process.env.MAX_ROUTE_DISTANCE_METERS ?? 3_000_000,
    );
    if (route.distanceMeters > maximumDistance)
      return NextResponse.json(
        { success: false, message: "Rute terlalu panjang untuk diproses." },
        { status: 422 },
      );
    return NextResponse.json(
      {
        success: true,
        route: {
          ...route,
          geometry: {
            ...route.geometry,
            coordinates: limitGeometry(route.geometry.coordinates),
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const serviceError = error instanceof ServiceError ? error : null;
    console.error("Perhitungan rute gagal:", serviceError?.code ?? "UNKNOWN");
    return NextResponse.json(
      {
        success: false,
        message:
          serviceError?.code === "NO_ROUTE"
            ? "Rute tidak ditemukan untuk kedua lokasi tersebut."
            : "Layanan rute sedang tidak dapat diakses. Silakan coba kembali.",
      },
      { status: serviceError?.status ?? 502 },
    );
  }
}
