"use client";

import { useState } from "react";
import { AlertTriangle, MapPinned } from "lucide-react";
import { useActiveRegion } from "@/hooks/use-active-region";
import { useWeather } from "@/hooks/use-weather";
import { useWarning } from "@/hooks/use-warning";
import { RegionControl } from "@/components/layout/region-control";
import { WarningPanel } from "@/components/warning/warning-panel";
import { DynamicMap } from "@/components/map/dynamic-map";
import { MapDetailPanel } from "@/components/map/map-detail-panel";
import type { MapSelection } from "@/components/map/map-selection";
import { Card } from "@/components/ui/card";

const format = (date?: string | null) =>
  date
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(date))
    : "Belum tersedia";

export function WarningsPage({ fullscreen = false }: { fullscreen?: boolean }) {
  const { region, selectRegion, regions } = useActiveRegion();
  const weather = useWeather(region.adm4);
  const warning = useWarning();
  const [warningFocus, setWarningFocus] = useState(0);
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const active =
    warning.data?.status === "active" ? warning.data.warnings.length : 0;
  const regionalActive =
    warning.data?.status === "active"
      ? warning.data.warnings.filter((item) => {
          const text = item.areas
            .map((area) => area.description ?? "")
            .join(" ")
            .toLocaleLowerCase("id-ID");
          return [region.village, region.district, region.regency].some(
            (name) => text.includes(name.toLocaleLowerCase("id-ID")),
          );
        }).length
      : 0;

  return (
    <div
      className={`space-y-5 ${
        fullscreen ? "min-h-full w-full p-4 md:p-6" : "mx-auto max-w-[1500px]"
      }`}
    >
      <RegionControl
        region={region}
        regions={regions}
        onSelect={selectRegion}
        title="Wilayah ini juga menjadi penanda lokasi pada peta"
      />

      <Card className="!p-4 md:!p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <h2 className="font-extrabold">Status peringatan dini</h2>
              <p className="text-sm text-slate-500">
                Data peringatan cuaca untuk Sumatera Utara
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-orange-100 px-3 py-1.5 font-bold text-orange-800">
              {warning.isLoading ? "Memuat…" : `${active} aktif`}
            </span>
            {!warning.isLoading && (
              <span className="rounded-full bg-sky-100 px-3 py-1.5 font-bold text-sky-800">
                {regionalActive} untuk wilayah aktif
              </span>
            )}
            <span className="text-slate-500">
              Diperiksa {format(warning.data?.checkedAt)}
            </span>
            <span className="text-slate-500">
              Feed diperbarui {format(warning.data?.feedUpdatedAt)}
            </span>
          </div>
        </div>
      </Card>

      <WarningPanel
        region={region}
        onFocus={() => setWarningFocus((value) => value + 1)}
      />

      <section>
        <div className="mb-4">
          <p className="eyebrow">Cakupan spasial</p>
          <h2 className="section-title">Peta area peringatan</h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.65fr)]">
          <Card className="!p-3">
            <DynamicMap
              weather={weather.data}
              earthquakes={[]}
              warning={warning.data}
              warningFocus={warningFocus}
              onSelectWeather={() =>
                weather.data &&
                setSelection({ type: "weather", value: weather.data })
              }
              onSelectEarthquake={() => undefined}
              onSelectWarning={(item) =>
                setSelection({ type: "warning", value: item })
              }
            />
          </Card>
          {selection ? (
            <MapDetailPanel
              selection={selection}
              onClose={() => setSelection(null)}
              onFocus={() => setWarningFocus((value) => value + 1)}
            />
          ) : (
            <Card>
              <MapPinned className="size-7 text-[#2d6f9f]" />
              <p className="eyebrow mt-4">Informasi peta</p>
              <h2 className="section-title">Area resmi dari feed BMKG</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Jika feed menyediakan polygon, area akan digambar pada peta.
                Tekan area untuk melihat rincian peringatan.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
