import type { RouteWeatherPoint } from "@/types/route";

function formatDateTime(value: string, timezone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export function RouteWeatherPopup({ point }: { point: RouteWeatherPoint }) {
  const timezone = point.region?.timezone ?? "Asia/Jakarta";
  const forecast = point.forecast;
  return (
    <div className="min-w-56 text-xs leading-relaxed text-slate-700">
      <p className="font-black text-slate-950">Titik {point.index + 1}</p>
      <p className="mt-1 font-bold">
        {point.region
          ? `${point.region.villageName}, ${point.region.districtName}`
          : "Wilayah ADM4 belum ditemukan"}
      </p>
      {point.region && <p>{point.region.regencyName}</p>}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
        <dt>Perkiraan tiba</dt>
        <dd className="font-bold">
          {formatDateTime(point.estimatedArrivalTime, timezone)}
        </dd>
        <dt>Jarak</dt>
        <dd className="font-bold">{point.distanceFromOriginKm} km</dd>
        <dt>Cuaca</dt>
        <dd className="font-bold">
          {forecast?.weatherDescription ?? "Tidak tersedia"}
        </dd>
        <dt>Suhu</dt>
        <dd>
          {forecast?.temperature == null ? "-" : `${forecast.temperature}°C`}
        </dd>
        <dt>Kelembapan</dt>
        <dd>{forecast?.humidity == null ? "-" : `${forecast.humidity}%`}</dd>
        <dt>Angin</dt>
        <dd>
          {forecast?.windSpeed == null
            ? "-"
            : `${forecast.windSpeed} km/jam${forecast.windDirection ? ` dari ${forecast.windDirection}` : ""}`}
        </dd>
        <dt>Jarak pandang</dt>
        <dd>{forecast?.visibility ?? "-"}</dd>
        <dt>Waktu prakiraan</dt>
        <dd>
          {forecast
            ? formatDateTime(forecast.datetime, timezone)
            : "Tidak tersedia"}
        </dd>
        <dt>Pembaruan</dt>
        <dd>
          {forecast?.analysisDate
            ? formatDateTime(forecast.analysisDate, timezone)
            : "Tidak tersedia"}
        </dd>
      </dl>
      {point.staleCache && (
        <p className="mt-2 font-bold text-amber-700">
          Menggunakan cache lama karena BMKG sementara tidak dapat diakses.
        </p>
      )}
      <p className="mt-2 border-t pt-2 font-bold text-[#1d5fa3]">
        Sumber data: BMKG
      </p>
    </div>
  );
}
