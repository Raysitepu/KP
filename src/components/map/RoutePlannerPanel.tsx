"use client";

import {
  ArrowDownUp,
  Crosshair,
  LocateFixed,
  MapPinned,
  Navigation,
  RotateCcw,
} from "lucide-react";
import type { ReturnTypeRoutePlanner } from "./route-planner-types";
import { DepartureTimePicker } from "./DepartureTimePicker";
import { LocationSearchInput } from "./LocationSearchInput";

export function RoutePlannerPanel({
  planner,
}: {
  planner: ReturnTypeRoutePlanner;
}) {
  const { state } = planner;
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#1d5fa3] text-white">
          <Navigation className="size-5" />
        </span>
        <div>
          <h2 className="font-black">Rute & cuaca perjalanan</h2>
          <p className="text-xs text-slate-500">
            Cakupan lokasi seluruh Indonesia
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <LocationSearchInput
          key={state.origin?.id ?? "origin-empty"}
          id="route-origin"
          label="Lokasi keberangkatan"
          value={state.origin}
          onSelect={(location) => planner.setLocation("origin", location)}
          onClear={() => planner.clearLocation("origin")}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={planner.useMyLocation}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold hover:border-[#55a47a]"
          >
            <LocateFixed className="size-3.5" /> Lokasi saya
          </button>
          <button
            type="button"
            onClick={() =>
              planner.setSelectionMode(
                state.selectionMode === "origin" ? null : "origin",
              )
            }
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold ${
              state.selectionMode === "origin"
                ? "border-[#1d5fa3] bg-blue-50 text-[#1d5fa3]"
                : "border-slate-200"
            }`}
          >
            <Crosshair className="size-3.5" /> Pilih dari peta
          </button>
        </div>

        <button
          type="button"
          onClick={planner.swapLocations}
          aria-label="Tukar lokasi awal dan tujuan"
          className="mx-auto grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:border-[#2d6f9f] hover:text-[#2d6f9f]"
        >
          <ArrowDownUp className="size-4" />
        </button>

        <LocationSearchInput
          key={state.destination?.id ?? "destination-empty"}
          id="route-destination"
          label="Lokasi tujuan"
          value={state.destination}
          onSelect={(location) => planner.setLocation("destination", location)}
          onClear={() => planner.clearLocation("destination")}
        />
        <button
          type="button"
          onClick={() =>
            planner.setSelectionMode(
              state.selectionMode === "destination" ? null : "destination",
            )
          }
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold ${
            state.selectionMode === "destination"
              ? "border-[#1d5fa3] bg-blue-50 text-[#1d5fa3]"
              : "border-slate-200"
          }`}
        >
          <MapPinned className="size-3.5" /> Pilih tujuan dari peta
        </button>

        <DepartureTimePicker
          value={state.departureTime}
          onChange={planner.setDepartureTime}
        />

        {state.error && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            {state.error}
          </p>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            disabled={
              !state.origin ||
              !state.destination ||
              state.isCalculatingRoute ||
              state.isLoadingWeather
            }
            onClick={() => void planner.calculate()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1d5fa3] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Navigation className="size-4" /> Cari rute
          </button>
          <button
            type="button"
            onClick={planner.clear}
            title="Hapus rute"
            className="grid size-12 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
