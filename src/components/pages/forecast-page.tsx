"use client";

import {
  CloudSun,
  Droplets,
  Eye,
  LoaderCircle,
  RefreshCw,
  Wind,
} from "lucide-react";
import { useState } from "react";
import { useActiveRegion } from "@/hooks/use-active-region";
import { useWeather } from "@/hooks/use-weather";
import { RegionControl } from "@/components/layout/region-control";
import { ForecastTabs } from "@/components/weather/forecast-tabs";
import { WeatherCharts } from "@/components/weather/weather-charts";
import { ErrorState, Skeleton } from "@/components/ui/states";

const value = (item: number | string | null | undefined, suffix = "") =>
  item == null || item === "" ? "–" : `${item}${suffix}`;

export function ForecastPage() {
  const { region, selectRegion, regions } = useActiveRegion();
  const weather = useWeather(region.adm4);
  const [refreshing, setRefreshing] = useState(false);
  const current = weather.data?.current;
  const metrics = [
    {
      icon: CloudSun,
      label: "Kondisi",
      metric: current?.weatherDescription ?? "–",
    },
    {
      icon: Droplets,
      label: "Kelembapan",
      metric: value(current?.humidity, "%"),
    },
    {
      icon: Wind,
      label: "Angin",
      metric: value(current?.windSpeed, " km/jam"),
    },
    {
      icon: Eye,
      label: "Jarak pandang",
      metric: value(current?.visibility),
    },
  ];

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <RegionControl
        region={region}
        regions={regions}
        onSelect={selectRegion}
        title="Cari desa, kecamatan, atau kabupaten/kota"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-600">
          {weather.data?.fetchedAt
            ? `Data diambil ${new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date(weather.data.fetchedAt))}`
            : "Menunggu data BMKG"}
        </p>
        <button
          type="button"
          disabled={refreshing || weather.isLoading}
          onClick={async () => {
            setRefreshing(true);
            try {
              await weather.refresh();
            } finally {
              setRefreshing(false);
            }
          }}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1d5fa3] px-4 text-xs font-bold text-white disabled:opacity-50"
        >
          {refreshing ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {refreshing ? "Mengambil dari BMKG…" : "Perbarui data BMKG"}
        </button>
      </div>

      {weather.isLoading ? (
        <Skeleton className="h-64" />
      ) : weather.isError ? (
        <ErrorState
          message="Prakiraan cuaca belum dapat dimuat. Silakan coba kembali."
          retry={() => weather.refetch()}
        />
      ) : weather.data ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-5 bg-gradient-to-r from-[#194f88] to-[#1686af] p-6 text-white sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-sky-100">
                  Prakiraan waktu terdekat
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {weather.data.location.village}
                </h2>
                <p className="mt-1 text-sm text-sky-100">
                  {weather.data.location.regency} · {current?.time ?? "–"} WIB
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-4xl font-black">
                  {value(current?.temperature, "°C")}
                </p>
                <p className="mt-1 font-semibold text-sky-100">
                  {current?.weatherDescription ?? "Belum tersedia"}
                </p>
              </div>
            </div>
            <div className="grid divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {metrics.map(({ icon: Icon, label, metric }) => (
                <div key={label} className="p-5">
                  <Icon className="size-5 text-[#2d6f9f]" />
                  <p className="mt-3 text-xs font-bold tracking-wide text-slate-500 uppercase">
                    {label}
                  </p>
                  <p className="mt-1 font-extrabold text-slate-900">{metric}</p>
                </div>
              ))}
            </div>
          </section>

          <ForecastTabs grouped={weather.data.grouped} />
          <WeatherCharts forecasts={weather.data.forecasts} />
        </>
      ) : null}
    </div>
  );
}
