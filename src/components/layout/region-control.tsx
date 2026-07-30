import { MapPin } from "lucide-react";
import { RegionSearch } from "@/components/search/region-search";
import type { Region } from "@/types/weather";

export function RegionControl({
  region,
  regions,
  onSelect,
  title = "Pilih wilayah Sumatera Utara",
}: {
  region: Region;
  regions: Region[];
  onSelect: (region: Region) => void;
  title?: string;
}) {
  return (
    <section className="relative overflow-visible rounded-2xl bg-gradient-to-r from-[#173e64] via-[#246895] to-[#3d8b78] p-5 text-white shadow-lg shadow-slate-300/40 md:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="landing-grid absolute inset-0 opacity-15" />
      </div>
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-[.14em] text-emerald-200 uppercase">
            Wilayah aktif
          </p>
          <h2 className="mt-1 flex items-start gap-2 text-xl font-black md:text-2xl">
            <MapPin className="mt-1 size-5 shrink-0 text-emerald-300" />
            <span>{region.village}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-200">
            {region.district}, {region.regency}
          </p>
        </div>
        <div className="w-full xl:max-w-3xl">
          <p className="mb-2 text-xs font-bold text-slate-200">{title}</p>
          <RegionSearch
            regions={regions}
            selected={region}
            onSelect={onSelect}
          />
        </div>
      </div>
    </section>
  );
}
