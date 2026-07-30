import {
  AlertTriangle,
  Clock3,
  CloudRain,
  Gauge,
  Route,
  Thermometer,
  Wind,
} from "lucide-react";
import type {
  RouteResult,
  RouteWeatherPoint,
  RouteWeatherSummary as Summary,
  SelectedLocation,
} from "@/types/route";

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.round((seconds % 3_600) / 60);
  return hours ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function pointTime(point: RouteWeatherPoint) {
  const timezone = point.region?.timezone ?? "Asia/Jakarta";
  const value = new Date(point.estimatedArrivalTime);
  if (Number.isNaN(value.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(value);
}

export function RouteWeatherSummary({
  route,
  points,
  summary,
  origin,
  destination,
  departureTime,
}: {
  route: RouteResult;
  points: RouteWeatherPoint[];
  summary: Summary | null;
  origin: SelectedLocation;
  destination: SelectedLocation;
  departureTime: string;
}) {
  const departure = new Date(departureTime);
  const arrival = new Date(departure.getTime() + route.durationSeconds * 1_000);
  const worst = points.find((point) => point.id === summary?.worstPointId);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Ringkasan perjalanan</p>
          <h3 className="mt-1 text-lg font-black">
            {origin.displayName.split(",")[0]} →{" "}
            {destination.displayName.split(",")[0]}
          </h3>
        </div>
        <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
          Berdasarkan prakiraan BMKG
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Route, "Jarak", `${(route.distanceMeters / 1_000).toFixed(1)} km`],
          [Clock3, "Durasi", duration(route.durationSeconds)],
          [Gauge, "Berangkat", formatTime(departure)],
          [Gauge, "Estimasi tiba", formatTime(arrival)],
        ].map(([Icon, label, value]) => (
          <div key={label as string} className="rounded-xl bg-slate-50 p-3">
            <Icon className="size-4 text-[#2d6f9f]" />
            <p className="mt-2 text-[11px] font-bold text-slate-500">
              {label as string}
            </p>
            <p className="text-sm font-black">{value as string}</p>
          </div>
        ))}
      </div>
      {summary && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <p className="flex gap-2 rounded-xl border border-slate-200 p-3 text-xs">
            <CloudRain className="size-4 shrink-0 text-sky-600" />
            <span>
              <strong>{summary.rainPointCount} titik hujan</strong>
              <br />
              {summary.firstRainDistanceKm == null
                ? "Belum ada prakiraan hujan pada titik tersedia."
                : `Mulai sekitar kilometer ${summary.firstRainDistanceKm}.`}
            </span>
          </p>
          <p className="flex gap-2 rounded-xl border border-slate-200 p-3 text-xs">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>
              <strong>{summary.worstCondition ?? "Belum tersedia"}</strong>
              <br />
              {worst?.region
                ? `Kondisi utama sekitar ${worst.region.villageName}.`
                : "Kondisi terburuk belum dapat ditentukan."}
            </span>
          </p>
          <p className="flex gap-2 rounded-xl border border-slate-200 p-3 text-xs">
            <Thermometer className="size-4 shrink-0 text-orange-600" />
            <span>
              Suhu {summary.minimumTemperature ?? "-"}–
              {summary.maximumTemperature ?? "-"}°C
              <br />
              <span className="inline-flex items-center gap-1">
                <Wind className="size-3" /> Angin maks.{" "}
                {summary.maximumWindSpeed ?? "-"} km/jam
              </span>
            </span>
          </p>
        </div>
      )}
      {summary?.unavailablePointCount ? (
        <p className="mt-4 text-xs font-bold text-amber-700">
          {summary.unavailablePointCount} titik belum memiliki prakiraan yang
          sesuai waktu tiba.
        </p>
      ) : null}
      {points.length ? (
        <div className="mt-5 border-t pt-4">
          <h4 className="text-sm font-black">Cuaca setiap titik perjalanan</h4>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {points.map((point) => (
              <li
                key={point.id}
                className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#1d5fa3] font-black text-white">
                  {point.index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-slate-900">
                    {point.region?.villageName ?? "Wilayah belum tersedia"}
                  </strong>
                  <span className="text-slate-500">
                    {point.forecast?.weatherDescription ??
                      "Prakiraan belum tersedia"}
                    {" · "}
                    {pointTime(point)}
                    {" · "}
                    {point.distanceFromOriginKm} km
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <p className="mt-4 border-t pt-4 text-xs leading-relaxed text-slate-500">
        Informasi cuaca sepanjang rute merupakan estimasi berdasarkan prakiraan
        BMKG pada wilayah kelurahan/desa dan perkiraan waktu perjalanan. Kondisi
        aktual, kemacetan, perubahan rute, dan perubahan cuaca dapat menyebabkan
        hasil berbeda.
      </p>
    </section>
  );
}
