"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CloudSun,
  Compass,
  Droplets,
  Eye,
  RefreshCw,
  Satellite,
  ShieldCheck,
  Database,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import regionDataset from "@/data/sumut-regions.json";
import type { Region, RegionDataset } from "@/types/weather";
import { RegionSearch } from "@/components/search/region-search";
import { useWeather } from "@/hooks/use-weather";
import { useEarthquakes } from "@/hooks/use-earthquakes";
import { useWarning } from "@/hooks/use-warning";
import { MetricCard } from "./metric-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { ForecastTabs } from "@/components/weather/forecast-tabs";
import { WeatherCharts } from "@/components/weather/weather-charts";
import { Card } from "@/components/ui/card";
import { DynamicMap } from "@/components/map/dynamic-map";
import { EarthquakePanel } from "@/components/earthquake/earthquake-panel";
import { FaqWidget } from "@/components/faq/faq-widget";
import { WarningPanel } from "@/components/warning/warning-panel";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  useEarthquakeFilters,
  type FilteredEarthquake,
} from "@/hooks/use-earthquake-filters";
import { MapDetailPanel } from "@/components/map/map-detail-panel";
import type { MapSelection } from "@/components/map/map-selection";

const regions = (regionDataset as RegionDataset).villages;
const STORAGE_KEY = "bmkg-sumut:last-region";
const defaultRegion =
  regions.find((r) => r.adm4 === "12.71.03.1001") ?? regions[0];
const display = (value: number | string | null | undefined, suffix = "") =>
  value == null || value === "" ? "Tidak tersedia" : `${value}${suffix}`;

export default function Dashboard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [region, setRegion] = useState(defaultRegion);
  const [selectedQuake, setSelectedQuake] = useState<FilteredEarthquake | null>(
    null,
  );
  const [mapSelection, setMapSelection] = useState<MapSelection | null>(null);
  const [mapFocus, setMapFocus] = useState<{
    type: "selected" | "warnings";
    id: number;
  } | null>(null);
  const [online, setOnline] = useState(true);
  const [cooldown, setCooldown] = useState(false);
  const [warningFocus, setWarningFocus] = useState(0);
  const weather = useWeather(region.adm4);
  const latest = useEarthquakes("latest");
  const warning = useWarning();
  const earthquakeFilters = useEarthquakeFilters(weather.data?.location);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const restore = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const valid = saved && regions.find((item) => item.adm4 === saved);
        if (valid) setRegion(valid);
      } catch {}
      update();
    };
    queueMicrotask(restore);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const selectRegion = (next: Region) => {
    setRegion(next);
    setSelectedQuake(null);
    try {
      localStorage.setItem(STORAGE_KEY, next.adm4);
    } catch {}
  };
  const refresh = async () => {
    if (cooldown || weather.isFetching) return;
    setCooldown(true);
    await Promise.all([weather.refetch(), latest.refetch(), warning.refetch()]);
    window.setTimeout(() => setCooldown(false), 10_000);
  };
  const current = weather.data?.current;
  const quake = latest.data?.items[0];
  const updated = weather.data?.fetchedAt
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(weather.data.fetchedAt))
    : "Belum diperbarui";
  return (
    <div
      id="dashboard"
      className={
        embedded
          ? "mx-auto max-w-[1680px] space-y-8 text-[#15324b]"
          : "min-h-screen bg-[#f3f6fa] text-[#15324b]"
      }
    >
      {!online && (
        <div
          role="status"
          className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950"
        >
          Anda sedang offline. Data yang sudah dimuat pada sesi ini mungkin
          masih dapat ditampilkan.
        </div>
      )}
      <header
        className={`relative overflow-visible bg-gradient-to-br from-[#102b46] via-[#245f8d] to-[#438db5] text-white ${embedded ? "rounded-2xl shadow-lg shadow-slate-300/40" : ""}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 overflow-hidden ${embedded ? "rounded-2xl" : ""}`}
        >
          <div className="landing-grid absolute inset-0 opacity-15" />
        </div>
        <div
          className={`relative mx-auto max-w-[1440px] px-4 py-6 md:px-8 ${embedded ? "md:py-6" : "md:py-8"}`}
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#55a47a] to-[#2d6f9f] shadow-xl shadow-black/20">
                <Satellite className="size-6" />
              </span>
              <div>
                <p className="mb-1 text-xs font-bold tracking-[.16em] text-[#d8eadc] uppercase">
                  BBMKG Wilayah I Medan • WebGIS Sumatera Utara
                </p>
                <h1 className="max-w-3xl text-2xl font-black tracking-tight md:text-3xl">
                  Dashboard Monitoring Cuaca dan Gempa Bumi
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-emerald-200 sm:inline-flex">
                <i
                  className={`size-2 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"}`}
                />
                {online ? "Sistem terhubung" : "Mode offline"}
              </span>
              <button
                onClick={refresh}
                disabled={cooldown || weather.isFetching}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#245f8d] shadow-lg transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-4 ${weather.isFetching ? "animate-spin" : ""}`}
                />
                {cooldown ? "Tunggu sebentar" : "Perbarui data"}
              </button>
            </div>
          </div>
          <RegionSearch
            regions={regions}
            selected={region}
            onSelect={selectRegion}
          />
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[#edf5ef]">
              <ShieldCheck className="size-3.5" />
              Dataset resmi BMKG
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[#edf5ef]">
              {(regionDataset as RegionDataset).regencies.length} kabupaten/kota
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[#edf5ef]">
              {(regionDataset as RegionDataset).districts.length} kecamatan
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[#edf5ef]">
              {regions.length.toLocaleString("id-ID")} desa/kelurahan
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-2xl border border-white/10 bg-[#102b46]/25 px-4 py-3 text-sm text-[#edf5ef] backdrop-blur-sm">
            <span>
              <span className="text-[#d8eadc]">Wilayah aktif</span>
              <strong className="ml-2 text-white">{region.label}</strong>
            </span>
            <span>
              <span className="text-[#d8eadc]">Diperbarui</span>
              <strong className="ml-2 text-white">{updated}</strong>
            </span>
          </div>
        </div>
      </header>
      {!embedded && <DashboardNavigation />}
      <main
        className={
          embedded
            ? "space-y-8"
            : "mx-auto max-w-[1440px] space-y-8 px-4 py-8 md:px-8 md:py-10"
        }
      >
        <section aria-labelledby="overview">
          <div className="mb-5">
            <p className="eyebrow">Prakiraan waktu terdekat</p>
            <h2 id="overview" className="section-title">
              Prakiraan wilayah aktif
            </h2>
          </div>
          {weather.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : weather.isError ? (
            <ErrorState
              message="Data cuaca belum dapat dimuat. Periksa koneksi internet atau coba kembali beberapa saat lagi."
              retry={() => weather.refetch()}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={CloudSun}
                tone="blue"
                label="Kondisi cuaca"
                value={current?.weatherDescription ?? "Tidak tersedia"}
                hint={current ? `Prakiraan ${current.time} WIB` : undefined}
              />
              <MetricCard
                icon={Thermometer}
                tone="orange"
                label="Suhu"
                value={display(current?.temperature, "°C")}
              />
              <MetricCard
                icon={Droplets}
                tone="cyan"
                label="Kelembapan"
                value={display(current?.humidity, "%")}
              />
              <MetricCard
                icon={Wind}
                tone="emerald"
                label="Kecepatan angin"
                value={display(current?.windSpeed, " km/jam")}
              />
              <MetricCard
                icon={Compass}
                tone="violet"
                label="Arah angin"
                value={display(current?.windDirection)}
              />
              <MetricCard
                icon={Eye}
                tone="indigo"
                label="Jarak pandang"
                value={display(current?.visibility)}
              />
              <MetricCard
                icon={AlertTriangle}
                tone="amber"
                label="Peringatan dini"
                value={
                  warning.data?.status === "active"
                    ? "Aktif"
                    : warning.data?.status === "none"
                      ? "Tidak ada yang aktif"
                      : "Belum tersedia"
                }
                hint={
                  warning.data?.status === "none"
                    ? "Berdasarkan feed BMKG saat diperiksa"
                    : (warning.data?.warnings[0]?.event ??
                      "Tidak disimpulkan sebagai kondisi aman")
                }
              />
              <MetricCard
                icon={Waves}
                tone="red"
                label="Gempa terbaru"
                value={quake ? `M${quake.magnitude ?? "–"}` : "Tidak tersedia"}
                hint={quake?.region}
              />
            </div>
          )}
          <p className="mt-4 text-sm text-slate-500">
            Nilai merupakan prakiraan BMKG untuk waktu terdekat, bukan
            pengukuran langsung stasiun.
          </p>
        </section>
        <div id="peringatan" className="scroll-mt-6">
          <WarningPanel
            onFocus={() => {
              setWarningFocus((value) => value + 1);
              document
                .querySelector(".leaflet-container")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </div>
        {weather.data && <ForecastTabs grouped={weather.data.grouped} />}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,.7fr)]">
          <Card>
            <div className="mb-5">
              <p className="eyebrow">WebGIS interaktif</p>
              <h2 className="section-title">
                Peta cuaca, peringatan, dan episenter
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pilih peringatan atau gempa untuk memusatkan peta.
              </p>
            </div>
            <DynamicMap
              weather={weather.data}
              earthquakes={earthquakeFilters.items}
              selectedEarthquake={selectedQuake}
              warning={warning.data}
              warningFocus={warningFocus}
              focusCommand={mapFocus}
              onSelectWeather={() =>
                weather.data &&
                setMapSelection({ type: "weather", value: weather.data })
              }
              onSelectEarthquake={(item) => {
                setSelectedQuake(item);
                setMapSelection({ type: "earthquake", value: item });
              }}
              onSelectWarning={(item) =>
                setMapSelection({ type: "warning", value: item })
              }
            />
          </Card>
          {mapSelection ? (
            <MapDetailPanel
              selection={mapSelection}
              onClose={() => setMapSelection(null)}
              onFocus={() =>
                setMapFocus({
                  type:
                    mapSelection.type === "warning" ? "warnings" : "selected",
                  id: Date.now(),
                })
              }
            />
          ) : (
            <Card>
              <p className="eyebrow">Detail administratif</p>
              <h2 className="section-title">Detail lokasi</h2>
              {weather.data ? (
                <dl className="mt-6 divide-y text-sm">
                  {[
                    ["Desa/Kelurahan", weather.data.location.village],
                    ["Kecamatan", weather.data.location.district],
                    ["Kabupaten/Kota", weather.data.location.regency],
                    ["Provinsi", weather.data.location.province],
                    ["Latitude", weather.data.location.latitude],
                    ["Longitude", weather.data.location.longitude],
                    ["Zona waktu", weather.data.location.timezone],
                    ["Kode ADM4", weather.data.location.adm4],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex justify-between gap-4 py-3"
                    >
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-right font-semibold">
                        {value ?? "–"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-6 text-slate-500">
                  Detail lokasi tersedia setelah data cuaca dimuat.
                </p>
              )}
            </Card>
          )}
        </section>
        {weather.data && <WeatherCharts forecasts={weather.data.forecasts} />}
        <div id="gempa" className="scroll-mt-6">
          <EarthquakePanel
            filters={earthquakeFilters}
            onMap={(item) => {
              setSelectedQuake(item);
              setMapSelection({ type: "earthquake", value: item });
              document
                .querySelector(".leaflet-container")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </div>
      </main>
      {!embedded && (
        <footer
          id="tentang"
          className="scroll-mt-20 border-t border-[#496b57]/15 bg-white"
        >
          <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#102b46] via-[#245f8d] to-[#55a47a] p-7 text-white shadow-xl shadow-slate-400/20 md:p-9">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex max-w-3xl items-start gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10">
                    <Satellite className="size-7" />
                  </span>
                  <div>
                    <p className="text-xs font-bold tracking-[.15em] text-[#d8eadc] uppercase">
                      Tentang sistem
                    </p>
                    <h2 className="mt-2 text-xl font-black md:text-2xl">
                      Dashboard Monitoring Cuaca dan Gempa Bumi
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#edf5ef]">
                      Prototype WebGIS dan FAQ Interaktif pada BBMKG Wilayah I
                      Medan untuk menyajikan kembali informasi resmi BMKG secara
                      lebih mudah dipahami.
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.bmkg.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#245f8d]"
                >
                  Kanal resmi BMKG
                </a>
              </div>
              <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 md:grid-cols-3">
                <div className="flex gap-3 rounded-xl bg-white/5 p-4">
                  <Database className="mt-0.5 size-5 shrink-0 text-[#d8eadc]" />
                  <div>
                    <h3 className="text-sm font-bold">Sumber data</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#d8eadc]">
                      Cuaca, gempa, nowcast, dan CAP dari layanan publik BMKG.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-white/5 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                  <div>
                    <h3 className="text-sm font-bold">Validasi</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#d8eadc]">
                      Data eksternal diperiksa dan dinormalisasi sebelum
                      ditampilkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-white/5 p-4">
                  <Compass className="mt-0.5 size-5 shrink-0 text-violet-300" />
                  <div>
                    <h3 className="text-sm font-bold">Dataset wilayah</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#d8eadc]">
                      {regionDataset.metadata.source}, dibuat{" "}
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date(regionDataset.metadata.generatedAt))}
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
              Informasi pada aplikasi ini tidak menggantikan kanal resmi BMKG
              atau instruksi pemerintah dan pihak berwenang.
            </p>
          </div>
        </footer>
      )}
      <FaqWidget
        weather={weather.data}
        latest={quake}
        warning={warning.data}
        lastUpdated={updated}
      />
    </div>
  );
}
