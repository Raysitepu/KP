import { NextResponse } from "next/server";
import {
  getEarthquakes,
  type EarthquakeType,
} from "@/services/bmkg-earthquake.service";
import { ServiceError } from "@/services/fetch-json";

const allowed = new Set<EarthquakeType>(["latest", "m5", "felt"]);
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") as EarthquakeType;
  if (!allowed.has(type))
    return NextResponse.json(
      { error: "Jenis data gempa tidak valid." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await getEarthquakes(type), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const known = error instanceof ServiceError;
    return NextResponse.json(
      { error: known ? error.message : "Data gempa belum dapat dimuat." },
      { status: known ? error.status : 500 },
    );
  }
}
