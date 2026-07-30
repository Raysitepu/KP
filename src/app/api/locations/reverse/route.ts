import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocoding/geocoding-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { parseCoordinateQuery } from "@/schemas/route";

export async function GET(request: Request) {
  const limit = rateLimit(requestKey(request, "location-reverse"), {
    limit: 30,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { success: false, message: "Terlalu banyak pencarian koordinat." },
      { status: 429 },
    );
  const parsed = parseCoordinateQuery(request.url);
  if (!parsed.success)
    return NextResponse.json(
      { success: false, message: "Koordinat tidak valid." },
      { status: 400 },
    );
  try {
    return NextResponse.json({
      success: true,
      location: await reverseGeocode(
        parsed.data.latitude,
        parsed.data.longitude,
      ),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Nama lokasi pada titik tersebut belum ditemukan.",
      },
      { status: 404 },
    );
  }
}
