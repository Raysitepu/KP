import { NextResponse } from "next/server";
import { regionSearchQuerySchema } from "@/schemas/chatbot";
import { searchRegionCandidates } from "@/lib/regions/region-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const limit = rateLimit(requestKey(request, "region-search"), { limit: 60 });
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Terlalu banyak pencarian. Silakan coba kembali." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  const parsed = regionSearchQuerySchema.safeParse(
    new URL(request.url).searchParams.get("q") ?? "",
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Masukkan minimal dua karakter nama wilayah." },
      { status: 400 },
    );
  const candidates = await searchRegionCandidates(parsed.data, 15);
  return NextResponse.json(
    { query: parsed.data, candidates },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    },
  );
}
