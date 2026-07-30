import { NextResponse } from "next/server";
import { getCachedWeather } from "@/lib/bmkg/weather-service";
import { ServiceError } from "@/services/fetch-json";
import { isValidSumutAdm4 } from "@/utils/weather";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const adm4 = params.get("adm4")?.trim() ?? "";
  const refresh = params.get("refresh") === "1";
  if (!isValidSumutAdm4(adm4))
    return NextResponse.json(
      { error: "Kode wilayah Sumatera Utara tidak valid." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await getCachedWeather(adm4, refresh), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const known = error instanceof ServiceError;
    return NextResponse.json(
      { error: known ? error.message : "Data cuaca belum dapat dimuat." },
      { status: known ? error.status : 500 },
    );
  }
}
