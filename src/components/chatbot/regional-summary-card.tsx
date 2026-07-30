import { CloudRain, MapPinned, Thermometer, Wind } from "lucide-react";
import type { RegionalWeatherSummary } from "@/types/chatbot";

function temperature(summary: RegionalWeatherSummary) {
  if (summary.minimumTemperature == null || summary.maximumTemperature == null)
    return "-";
  return summary.minimumTemperature === summary.maximumTemperature
    ? `${summary.minimumTemperature}°C`
    : `${summary.minimumTemperature}–${summary.maximumTemperature}°C`;
}

export function RegionalSummaryCard({
  summary,
}: {
  summary: RegionalWeatherSummary;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-white">
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <p className="font-extrabold text-emerald-900">
          Ringkasan umum {summary.regencyName}
        </p>
        <p className="mt-0.5 text-[11px] text-emerald-800">
          {summary.context} · {summary.availableAreaCount} dari{" "}
          {summary.sampledAreaCount} wilayah perwakilan · Sumber: BMKG
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3 text-center text-[11px]">
        <div className="rounded-lg bg-orange-50 p-2 text-orange-900">
          <Thermometer className="mx-auto size-4" />
          <strong className="mt-1 block">{temperature(summary)}</strong>
          Suhu
        </div>
        <div className="rounded-lg bg-sky-50 p-2 text-sky-900">
          <CloudRain className="mx-auto size-4" />
          <strong className="mt-1 block">
            {summary.rainAreaCount}/{summary.availableAreaCount}
          </strong>
          Wilayah hujan
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-800">
          <Wind className="mx-auto size-4" />
          <strong className="mt-1 block">
            {summary.maximumWindSpeed ?? "-"} km/jam
          </strong>
          Angin maksimum
        </div>
      </div>

      <div className="border-t border-slate-100 p-3">
        <p className="mb-2 text-[11px] font-extrabold text-slate-600">
          Wilayah yang diperiksa
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {summary.samples.map((sample) => (
            <li
              key={sample.adm4}
              className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-[11px]"
            >
              <MapPinned className="mt-0.5 size-3.5 shrink-0 text-[#2d6f9f]" />
              <span>
                <strong className="block text-slate-900">
                  {sample.districtName}
                </strong>
                <span className="text-slate-500">
                  {sample.conditions.length
                    ? sample.conditions.join(", ")
                    : "Data belum tersedia"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
        Gambaran beberapa wilayah perwakilan. Kondisi setiap kecamatan dan
        desa/kelurahan dapat berbeda.
      </p>
    </div>
  );
}
