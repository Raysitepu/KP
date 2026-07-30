"use client";

import { useState } from "react";
import { Activity, CheckCircle2, MapPin, Waves } from "lucide-react";
import { useActiveRegion } from "@/hooks/use-active-region";
import { useWeather } from "@/hooks/use-weather";
import {
  useEarthquakeFilters,
  type FilteredEarthquake,
} from "@/hooks/use-earthquake-filters";
import { RegionControl } from "@/components/layout/region-control";
import { EarthquakePanel } from "@/components/earthquake/earthquake-panel";
import { DynamicMap } from "@/components/map/dynamic-map";
import { MapDetailPanel } from "@/components/map/map-detail-panel";
import type { MapSelection } from "@/components/map/map-selection";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";

export function EarthquakesPage() {
  const { region, selectRegion, regions } = useActiveRegion();
  const weather = useWeather(region.adm4);
  const filters = useEarthquakeFilters(weather.data?.location);
  const [selected, setSelected] = useState<FilteredEarthquake | null>(null);
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const latest = filters.items[0];

  const selectQuake = (item: FilteredEarthquake) => {
    setSelected(item);
    setSelection({ type: "earthquake", value: item });
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <RegionControl
        region={region}
        regions={regions}
        onSelect={(next) => {
          selectRegion(next);
          setSelected(null);
          setSelection(null);
        }}
        title="Pilih wilayah acuan untuk filter radius gempa"
      />

      {filters.query.isLoading ? (
        <Skeleton className="h-48" />
      ) : latest ? (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#8f1d2c] via-[#b4232f] to-[#dc4c35] p-6 text-white shadow-xl shadow-red-200/50 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-extrabold tracking-[.12em] text-red-100 uppercase">
                <Activity className="size-4" />
                Gempa terbaru pada feed terpilih
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-2">
                <p className="text-5xl font-black tracking-tight">
                  M{latest.magnitude ?? "–"}
                </p>
                <div className="pb-1">
                  <h2 className="text-xl font-black">{latest.region}</h2>
                  <p className="mt-1 text-sm text-red-100">
                    {latest.date} · {latest.time} · Kedalaman {latest.depth}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-96">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs text-red-100">Informasi BMKG</p>
                <p className="mt-1 flex items-start gap-2 text-sm font-bold">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  {latest.potential}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs text-red-100">Koordinat</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold">
                  <MapPin className="size-4 text-amber-200" />
                  {latest.latitude != null && latest.longitude != null
                    ? `${latest.latitude}, ${latest.longitude}`
                    : "Tidak tersedia"}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <EarthquakePanel filters={filters} onMap={selectQuake} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.65fr)]">
        <Card className="!p-3">
          <DynamicMap
            weather={weather.data}
            earthquakes={filters.items}
            selectedEarthquake={selected}
            onSelectWeather={() =>
              weather.data &&
              setSelection({ type: "weather", value: weather.data })
            }
            onSelectEarthquake={selectQuake}
            onSelectWarning={() => undefined}
          />
        </Card>
        {selection ? (
          <MapDetailPanel
            selection={selection}
            onClose={() => setSelection(null)}
            onFocus={() => undefined}
          />
        ) : (
          <Card>
            <Waves className="size-7 text-[#2d6f9f]" />
            <p className="eyebrow mt-4">Petunjuk peta</p>
            <h2 className="section-title">Pilih episenter gempa</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Tekan marker gempa pada peta atau tombol “Lihat di peta” pada
              daftar untuk menampilkan detail kejadian.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
