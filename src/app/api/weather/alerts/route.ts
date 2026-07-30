import { NextResponse } from "next/server";
import { regionSearchQuerySchema } from "@/schemas/chatbot";
import { resolveLocation } from "@/lib/regions/region-service";
import { getCachedWeather } from "@/lib/bmkg/weather-service";
import {
  filterAlertsForRegion,
  getCachedAlerts,
} from "@/lib/bmkg/alert-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const limit = rateLimit(requestKey(request, "weather-alerts"), { limit: 40 });
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba kembali." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  const query = regionSearchQuerySchema.safeParse(
    new URL(request.url).searchParams.get("location") ?? "",
  );
  if (!query.success)
    return NextResponse.json(
      { error: "Nama lokasi tidak valid." },
      { status: 400 },
    );
  const resolution = await resolveLocation(`di ${query.data}`);
  if (resolution.status !== "resolved")
    return NextResponse.json(
      {
        success: false,
        requiresLocationSelection: resolution.status === "ambiguous",
        message: resolution.message,
        candidates: resolution.candidates,
      },
      { status: resolution.status === "not_found" ? 404 : 200 },
    );
  const weather = await getCachedWeather(resolution.region.adm4);
  const region = {
    ...resolution.region,
    latitude: weather.location.latitude ?? resolution.region.latitude,
    longitude: weather.location.longitude ?? resolution.region.longitude,
  };
  const response = await getCachedAlerts();
  const alerts = filterAlertsForRegion(response, region);
  return NextResponse.json(
    {
      success: response.status !== "unavailable",
      status: response.status,
      location: region,
      alerts,
      checkedAt: response.checkedAt,
      message:
        response.status === "unavailable"
          ? "Sistem gagal memeriksa peringatan BMKG."
          : response.status === "none"
            ? "Tidak ada peringatan aktif pada feed BMKG saat diperiksa."
            : alerts.length
              ? "Lokasi tercantum dalam peringatan aktif."
              : "Lokasi tidak tercantum sebagai wilayah terdampak.",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    },
  );
}
