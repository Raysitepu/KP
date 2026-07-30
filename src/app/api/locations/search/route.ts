import { NextResponse } from "next/server";
import { searchIndonesiaLocations } from "@/lib/geocoding/geocoding-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { locationQuerySchema, sanitizeLocationQuery } from "@/schemas/route";

export async function GET(request: Request) {
  const limit = rateLimit(requestKey(request, "location-search"), {
    limit: 30,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { success: false, message: "Terlalu banyak pencarian lokasi." },
      { status: 429 },
    );
  const query = sanitizeLocationQuery(
    new URL(request.url).searchParams.get("q") ?? "",
  );
  const parsed = locationQuerySchema.safeParse(query);
  if (!parsed.success)
    return NextResponse.json(
      { success: false, results: [], message: "Ketik minimal tiga karakter." },
      { status: 400 },
    );
  try {
    const results = await searchIndonesiaLocations(parsed.data);
    return NextResponse.json(
      { success: true, results },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        results: [],
        message: "Pencarian lokasi sedang tidak dapat diakses.",
      },
      { status: 502 },
    );
  }
}
