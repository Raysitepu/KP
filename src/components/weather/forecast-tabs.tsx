"use client";
import { useState } from "react";
import { Droplets, Wind, ChevronDown } from "lucide-react";
import type { NormalizedForecast } from "@/types/weather";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export function ForecastTabs({
  grouped,
}: {
  grouped: Record<string, NormalizedForecast[]>;
}) {
  const dates = Object.keys(grouped).slice(0, 3);
  const [selected, setSelected] = useState(dates[0] ?? "");
  const activeDate = dates.includes(selected) ? selected : (dates[0] ?? "");
  const labels = ["Hari ini", "Besok", "Lusa"];
  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(`${date}T00:00:00+07:00`));
  if (!dates.length)
    return <EmptyState message="Prakiraan cuaca belum tersedia." />;
  return (
    <Card id="prakiraan" className="scroll-mt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Prakiraan 3 harian</p>
          <h2 className="section-title">Cuaca setiap tiga jam</h2>
        </div>
        <div role="tablist" className="flex rounded-xl bg-slate-100 p-1">
          {dates.map((date, i) => (
            <button
              role="tab"
              aria-selected={activeDate === date}
              aria-controls="forecast-tab-panel"
              key={date}
              onClick={() => setSelected(date)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeDate === date
                  ? "bg-white text-[#496b57] shadow-sm"
                  : "text-slate-600"
              }`}
            >
              <span className="block">{labels[i]}</span>
              <span className="mt-0.5 block text-[10px] font-medium opacity-75">
                {dateLabel(date)}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div
        id="forecast-tab-panel"
        role="tabpanel"
        aria-label={`Prakiraan ${dateLabel(activeDate)}`}
        className="flex snap-x gap-4 overflow-x-auto pb-3"
      >
        {(grouped[activeDate] ?? []).map((item) => (
          <article
            key={item.datetime}
            className="min-w-48 snap-start rounded-xl border bg-slate-50 p-4"
          >
            <time className="text-sm font-semibold text-[#496b57]">
              {item.time} WIB
            </time>
            <p className="mt-3 min-h-12 font-semibold text-slate-900">
              {item.weatherDescription}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {item.temperature ?? "–"}°
            </p>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Droplets className="size-4" />
                {item.humidity ?? "–"}%
              </p>
              <p className="flex items-center gap-2">
                <Wind className="size-4" />
                {item.windSpeed ?? "–"} km/jam
              </p>
            </div>
            <details className="mt-4 border-t pt-3 text-sm text-slate-600">
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                Detail <ChevronDown className="size-4" />
              </summary>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <dt>Arah angin</dt>
                  <dd>{item.windDirection ?? "–"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tutupan awan</dt>
                  <dd>{item.cloudCover ?? "–"}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Jarak pandang</dt>
                  <dd>{item.visibility ?? "–"}</dd>
                </div>
              </dl>
            </details>
          </article>
        ))}
      </div>
    </Card>
  );
}
