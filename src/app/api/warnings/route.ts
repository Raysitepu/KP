import { NextResponse } from "next/server";
import { getWeatherWarning } from "@/services/bmkg-warning.service";
export async function GET() {
  return NextResponse.json(await getWeatherWarning(), {
    headers: {
      "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60",
    },
  });
}
