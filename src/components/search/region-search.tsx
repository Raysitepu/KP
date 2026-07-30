"use client";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Region } from "@/types/weather";
import { searchRegions } from "@/utils/regions";

export function RegionSearch({
  regions,
  selected,
  onSelect,
}: {
  regions: Region[];
  selected: Region;
  onSelect: (region: Region) => void;
}) {
  const [mode, setMode] = useState<"direct" | "hierarchy">("direct");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [regencyCode, setRegencyCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const results = useMemo(
    () => searchRegions(regions, query),
    [regions, query],
  );
  const regencies = useMemo(
    () => [
      ...new Map(
        regions.map((region) => [region.regencyCode, region.regency]),
      ).entries(),
    ],
    [regions],
  );
  const districts = useMemo(
    () => [
      ...new Map(
        regions
          .filter((region) => region.regencyCode === regencyCode)
          .map((region) => [region.districtCode, region.district]),
      ).entries(),
    ],
    [regions, regencyCode],
  );
  const villages = useMemo(
    () => regions.filter((region) => region.districtCode === districtCode),
    [regions, districtCode],
  );
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const choose = (region: Region) => {
    onSelect(region);
    setQuery("");
    setOpen(false);
  };
  return (
    <div ref={root} className="relative w-full max-w-3xl">
      <div
        role="tablist"
        aria-label="Model pemilihan wilayah"
        className="mb-3 inline-flex rounded-xl bg-slate-800 p-1"
      >
        <button
          role="tab"
          aria-selected={mode === "direct"}
          onClick={() => setMode("direct")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === "direct" ? "bg-white text-slate-950" : "text-slate-300"}`}
        >
          Cari Langsung
        </button>
        <button
          role="tab"
          aria-selected={mode === "hierarchy"}
          onClick={() => {
            setMode("hierarchy");
            setOpen(false);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === "hierarchy" ? "bg-white text-slate-950" : "text-slate-300"}`}
        >
          Pilih Bertingkat
        </button>
      </div>
      {mode === "direct" ? (
        <>
          <label htmlFor="region-search" className="sr-only">
            Cari desa, kecamatan, kota, atau kode ADM4
          </label>
          <Search className="pointer-events-none absolute top-3.5 left-4 size-5 text-slate-400" />
          <input
            id="region-search"
            role="combobox"
            aria-expanded={open}
            aria-controls="region-results"
            aria-autocomplete="list"
            value={query}
            placeholder={`Cari wilayah — aktif: ${selected.village}`}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((v) => Math.min(v + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((v) => Math.max(v - 1, 0));
              }
              if (e.key === "Enter" && results[active]) choose(results[active]);
              if (e.key === "Escape") setOpen(false);
            }}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pr-11 pl-12 text-slate-900 ring-blue-500 outline-none placeholder:text-slate-500 focus:ring-2"
          />
          {query && (
            <button
              aria-label="Hapus pencarian"
              onClick={() => setQuery("")}
              className="absolute top-3 right-3 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            >
              <X />
            </button>
          )}
          {open && (
            <div
              id="region-results"
              role="listbox"
              className="absolute z-[1001] mt-2 max-h-80 w-full overflow-auto rounded-xl border bg-white p-2 text-slate-900 shadow-xl"
            >
              {results.length ? (
                results.map((region, index) => (
                  <button
                    role="option"
                    aria-selected={index === active}
                    key={region.adm4}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(region)}
                    className={`block w-full rounded-lg p-3 text-left ${index === active ? "bg-[#eef3ed]" : "hover:bg-stone-50"}`}
                  >
                    <span className="block font-semibold">
                      {region.village}
                    </span>
                    <span className="block text-sm text-slate-600">
                      {region.district}, {region.regency}
                    </span>
                    <span className="block text-xs text-slate-400">
                      Kode: {region.adm4}
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-slate-500">
                  Wilayah tidak ditemukan.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-xs font-semibold text-slate-300">
            <span>Pilih Kabupaten/Kota</span>
            <select
              value={regencyCode}
              onChange={(event) => {
                setRegencyCode(event.target.value);
                setDistrictCode("");
              }}
              className="min-h-12 rounded-xl border border-slate-600 bg-white px-3 text-sm text-slate-950"
            >
              <option value="">Kabupaten/Kota</option>
              {regencies.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-300">
            <span>Pilih Kecamatan</span>
            <select
              disabled={!regencyCode}
              value={districtCode}
              onChange={(event) => setDistrictCode(event.target.value)}
              className="min-h-12 rounded-xl border border-slate-600 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200"
            >
              <option value="">Kecamatan</option>
              {districts.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-300">
            <span>Pilih Desa/Kelurahan</span>
            <select
              disabled={!districtCode}
              value=""
              onChange={(event) => {
                const region = regions.find(
                  (item) => item.adm4 === event.target.value,
                );
                if (region) choose(region);
              }}
              className="min-h-12 rounded-xl border border-slate-600 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200"
            >
              <option value="">Desa/Kelurahan</option>
              {villages.map((region) => (
                <option key={region.adm4} value={region.adm4}>
                  {region.village}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
