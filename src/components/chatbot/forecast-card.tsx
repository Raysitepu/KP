import { Cloud, CloudRain, CloudSun, Droplets, Wind } from "lucide-react";
import type { NormalizedForecast } from "@/types/weather";
import type { RegionCandidate } from "@/types/regions";

function WeatherIcon({ description }: { description: string }) {
  if (/hujan|petir/i.test(description)) return <CloudRain className="size-5" />;
  if (/cerah/i.test(description)) return <CloudSun className="size-5" />;
  return <Cloud className="size-5" />;
}

export function ForecastCard({
  location,
  forecasts,
}: {
  location: RegionCandidate;
  forecasts: NormalizedForecast[];
}) {
  if (!forecasts.length) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-sky-200 bg-white">
      <div className="border-b border-sky-100 bg-sky-50 px-4 py-3">
        <p className="text-xs font-extrabold text-[#1d5fa3]">
          {location.villageName}, {location.districtName}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {location.regencyName} · Sumber: BMKG
        </p>
      </div>
      <div className="flex snap-x gap-2 overflow-x-auto p-3">
        {forecasts.slice(0, 8).map((forecast) => (
          <article
            key={`${forecast.date}-${forecast.time}-${location.adm4}`}
            className="min-w-36 snap-start rounded-xl bg-slate-50 p-3"
          >
            <div className="flex items-center justify-between text-[#2d6f9f]">
              <WeatherIcon description={forecast.weatherDescription} />
              <time className="text-[10px] font-bold">{forecast.time}</time>
            </div>
            <p className="mt-2 text-xs font-extrabold text-slate-900">
              {forecast.weatherDescription}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {forecast.temperature ?? "–"}°C
            </p>
            <div className="mt-2 space-y-1 text-[10px] text-slate-500">
              <p className="flex items-center gap-1">
                <Droplets className="size-3" />
                {forecast.humidity ?? "–"}%
              </p>
              <p className="flex items-center gap-1">
                <Wind className="size-3" />
                {forecast.windSpeed ?? "–"} km/jam
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
