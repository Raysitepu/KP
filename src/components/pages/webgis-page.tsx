"use client";

import { useState } from "react";
import {
  Activity,
  CloudSun,
  Layers3,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import { useActiveRegion } from "@/hooks/use-active-region";
import { useWeather } from "@/hooks/use-weather";
import { useWarning } from "@/hooks/use-warning";
import {
  useEarthquakeFilters,
  type EarthquakeRadius,
  type FilteredEarthquake,
} from "@/hooks/use-earthquake-filters";
import { RegionControl } from "@/components/layout/region-control";
import { Card } from "@/components/ui/card";
import { DynamicMap } from "@/components/map/dynamic-map";
import { MapDetailPanel } from "@/components/map/map-detail-panel";
import type { MapSelection } from "@/components/map/map-selection";
import type { EarthquakeType } from "@/services/bmkg-earthquake.service";
import { RoutePlannerFeature } from "@/components/map/RoutePlannerFeature";
import { MagnitudeInput } from "@/components/earthquake/magnitude-input";

export function WebgisPage() {
  const { region, selectRegion, regions } = useActiveRegion();
  const weather = useWeather(region.adm4);
  const warning = useWarning();
  const filters = useEarthquakeFilters(weather.data?.location);
  const [selectedQuake, setSelectedQuake] = useState<FilteredEarthquake | null>(
    null,
  );
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [view, setView] = useState<"monitoring" | "route">("monitoring");

  const warningCount =
    warning.data?.status === "active" ? warning.data.warnings.length : 0;
  const layerSummary = [
    {
      icon: CloudSun,
      value: weather.data ? 1 : 0,
      label: "Lokasi cuaca",
      tone: "blue",
    },
    {
      icon: Activity,
      value: filters.items.length,
      label: "Gempa",
      tone: "red",
    },
    {
      icon: ShieldAlert,
      value: warningCount,
      label: "Peringatan",
      tone: "amber",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setView("monitoring")}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-extrabold ${
            view === "monitoring"
              ? "bg-[#1d5fa3] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers3 className="size-4" /> Monitoring
        </button>
        <button
          type="button"
          onClick={() => setView("route")}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-extrabold ${
            view === "route"
              ? "bg-[#1d5fa3] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Navigation className="size-4" /> Rute & cuaca
        </button>
      </div>

      {view === "route" ? (
        <RoutePlannerFeature />
      ) : (
        <>
          <RegionControl
            region={region}
            regions={regions}
            onSelect={(next) => {
              selectRegion(next);
              setSelectedQuake(null);
              setSelection(null);
            }}
          />

          <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <Card>
                <div className="flex items-center gap-2">
                  <Layers3 className="size-5 text-[#2d6f9f]" />
                  <h2 className="font-extrabold">Filter layer</h2>
                </div>
                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-bold">
                    Data gempa
                    <select
                      value={filters.type}
                      onChange={(event) =>
                        filters.setType(event.target.value as EarthquakeType)
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                    >
                      <option value="latest">Gempa terbaru</option>
                      <option value="m5">Gempa M5+</option>
                      <option value="felt">Gempa dirasakan</option>
                    </select>
                  </label>
                  <label className="block text-sm font-bold">
                    Radius dari wilayah aktif
                    <select
                      value={filters.radius}
                      onChange={(event) =>
                        filters.setRadius(
                          event.target.value === "all"
                            ? "all"
                            : (Number(event.target.value) as EarthquakeRadius),
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                    >
                      <option value="all">Seluruh Indonesia</option>
                      <option value="100">100 km</option>
                      <option value="250">250 km</option>
                      <option value="500">500 km</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <MagnitudeInput
                      label="Min. magnitudo"
                      value={filters.minMagnitude}
                      onChange={filters.setMinMagnitude}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                    <MagnitudeInput
                      label="Maks. magnitudo"
                      value={filters.maxMagnitude}
                      onChange={filters.setMaxMagnitude}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <p className="eyebrow">Ringkasan layer</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {layerSummary.map(({ icon: Icon, value, label, tone }) => (
                    <div
                      key={label}
                      className={`rounded-xl p-3 ${
                        tone === "blue"
                          ? "bg-blue-50 text-blue-800"
                          : tone === "red"
                            ? "bg-red-50 text-red-800"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      <Icon className="size-4" />
                      <p className="mt-2 text-xl font-black">{value}</p>
                      <p className="text-[11px] font-semibold">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Visibilitas layer dan pilihan basemap dapat diatur langsung
                  dari kontrol di dalam peta.
                </p>
              </Card>
            </aside>

            <div className="space-y-5">
              <Card className="!p-3">
                <DynamicMap
                  weather={weather.data}
                  earthquakes={filters.items}
                  selectedEarthquake={selectedQuake}
                  warning={warning.data}
                  onSelectWeather={() =>
                    weather.data &&
                    setSelection({ type: "weather", value: weather.data })
                  }
                  onSelectEarthquake={(item) => {
                    setSelectedQuake(item);
                    setSelection({ type: "earthquake", value: item });
                  }}
                  onSelectWarning={(item) =>
                    setSelection({ type: "warning", value: item })
                  }
                />
              </Card>
              {selection && (
                <MapDetailPanel
                  selection={selection}
                  onClose={() => setSelection(null)}
                  onFocus={() => undefined}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
