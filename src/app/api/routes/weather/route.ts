import { NextResponse } from "next/server";
import { routeWeatherRequestSchema } from "@/schemas/route";
import { buildRouteWeather } from "@/lib/route-weather/route-weather-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(requestKey(request, "route-weather"), { limit: 12 });
  if (!limit.allowed)
    return NextResponse.json(
      { success: false, message: "Terlalu banyak permintaan cuaca rute." },
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
  const parsed = routeWeatherRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        message:
          parsed.error.issues[0]?.message ?? "Data geometri rute tidak valid.",
      },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      await buildRouteWeather({
        geometry: parsed.data.routeGeometry,
        totalDistanceMeters: parsed.data.totalDistanceMeters,
        totalDurationSeconds: parsed.data.totalDurationSeconds,
        departureTime: parsed.data.departureTime,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Penyusunan cuaca rute gagal:",
      error instanceof Error ? error.message : "UNKNOWN",
    );
    return NextResponse.json(
      {
        success: false,
        message:
          "Cuaca rute belum dapat diproses. Garis rute tetap dapat digunakan.",
      },
      { status: 502 },
    );
  }
}
