"use client";
import { ExternalLink, MapPin, Waves } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import type { EarthquakeType } from "@/services/bmkg-earthquake.service";
import type {
  FilteredEarthquake,
  EarthquakeRadius,
} from "@/hooks/use-earthquake-filters";
import { isAllowedBmkgShakemapUrl } from "@/utils/earthquake";
import { MagnitudeInput } from "./magnitude-input";

const tabs: { value: EarthquakeType; label: string }[] = [
  { value: "latest", label: "Terbaru" },
  { value: "m5", label: "M5+" },
  { value: "felt", label: "Dirasakan" },
];
type Props = {
  filters: {
    type: EarthquakeType;
    setType: (value: EarthquakeType) => void;
    radius: EarthquakeRadius;
    setRadius: (value: EarthquakeRadius) => void;
    minMagnitude: number;
    setMinMagnitude: (value: number) => void;
    maxMagnitude: number;
    setMaxMagnitude: (value: number) => void;
    items: FilteredEarthquake[];
    description: string;
    query: { isLoading: boolean; isError: boolean; refetch: () => unknown };
  };
  onMap: (item: FilteredEarthquake) => void;
};
export function EarthquakePanel({ filters, onMap }: Props) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Aktivitas seismik</p>
          <h2 className="section-title">{filters.description}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filters.items.length} hasil ditampilkan pada panel dan WebGIS.
          </p>
        </div>
        <div role="tablist" className="flex rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              role="tab"
              aria-selected={filters.type === tab.value}
              key={tab.value}
              onClick={() => filters.setType(tab.value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${filters.type === tab.value ? "bg-white text-[#496b57] shadow-sm" : "text-slate-600"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">
          Cakupan
          <select
            value={filters.radius}
            onChange={(event) =>
              filters.setRadius(
                event.target.value === "all"
                  ? "all"
                  : (Number(event.target.value) as EarthquakeRadius),
              )
            }
            className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"
          >
            <option value="all">Seluruh Indonesia</option>
            <option value="100">Radius 100 km</option>
            <option value="250">Radius 250 km</option>
            <option value="500">Radius 500 km</option>
          </select>
        </label>
        <MagnitudeInput
          label="Magnitudo minimum"
          value={filters.minMagnitude}
          onChange={filters.setMinMagnitude}
        />
        <MagnitudeInput
          label="Magnitudo maksimum"
          value={filters.maxMagnitude}
          onChange={filters.setMaxMagnitude}
        />
      </div>
      {filters.query.isLoading ? (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      ) : filters.query.isError ? (
        <ErrorState
          message="Data gempa belum dapat dimuat. Periksa koneksi atau coba kembali."
          retry={() => filters.query.refetch()}
        />
      ) : !filters.items.length ? (
        <EmptyState message="Tidak ada gempa yang cocok dengan filter dan cakupan saat ini." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filters.items.map((item) => (
            <article key={item.id} className="rounded-xl border p-4">
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-700">
                  M{item.magnitude ?? "–"}
                </span>
                <div>
                  <time className="text-sm text-slate-500">
                    {item.date} • {item.time}
                  </time>
                  <h3 className="mt-1 leading-snug font-bold">{item.region}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Kedalaman {item.depth}
                    {item.distanceKm != null
                      ? ` • ${Math.round(item.distanceKm)} km dari wilayah aktif`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="flex gap-2">
                  <Waves className="size-4 shrink-0" />
                  {item.potential}
                </p>
                {item.felt && (
                  <p className="mt-2 text-slate-600">Dirasakan: {item.felt}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  disabled={item.latitude == null}
                  onClick={() => onMap(item)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <MapPin className="size-4" />
                  Lihat di peta
                </button>
                {isAllowedBmkgShakemapUrl(item.shakemapUrl) && (
                  <a
                    href={item.shakemapUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
                  >
                    <ExternalLink className="size-4" />
                    Shakemap BMKG
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
