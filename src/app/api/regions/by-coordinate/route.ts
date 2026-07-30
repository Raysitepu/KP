import { NextResponse } from "next/server";
import { findRegionByCoordinate } from "@/lib/regions/coordinate-region-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { parseCoordinateQuery } from "@/schemas/route";

export async function GET(request: Request) {
  const limit = rateLimit(requestKey(request, "region-coordinate"), {
    limit: 60,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { success: false, message: "Terlalu banyak pencarian wilayah." },
      { status: 429 },
    );
  const parsed = parseCoordinateQuery(request.url);
  if (!parsed.success)
    return NextResponse.json(
      { success: false, message: "Koordinat tidak valid." },
      { status: 400 },
    );
  if (!isSupabaseConfigured())
    return NextResponse.json(
      {
        success: false,
        region: null,
        errorCode: "REGION_DATABASE_UNAVAILABLE",
        message: "Database polygon wilayah belum dikonfigurasi.",
      },
      { status: 503 },
    );
  const region = await findRegionByCoordinate(parsed.data);
  return NextResponse.json(
    region
      ? { success: true, region }
      : {
          success: false,
          region: null,
          errorCode: "REGION_NOT_FOUND",
          message: "Polygon ADM4 tidak ditemukan pada koordinat tersebut.",
        },
    { status: region ? 200 : 404 },
  );
}
