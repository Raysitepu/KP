"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { MapSelection } from "./map-selection";
import { MapDetailContent } from "./map-detail-content";
export function MapDetailPanel({
  selection,
  onClose,
  onFocus,
}: {
  selection: MapSelection | null;
  onClose: () => void;
  onFocus: () => void;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  if (!selection) return null;
  return (
    <>
      <aside
        aria-label="Detail WebGIS"
        className="hidden max-h-[520px] overflow-y-auto rounded-xl border bg-white p-5 xl:block"
      >
        <button
          onClick={onClose}
          aria-label="Tutup detail"
          className="float-right grid size-10 place-items-center rounded-lg hover:bg-slate-100"
        >
          <X className="size-5" />
        </button>
        <MapDetailContent selection={selection} onFocus={onFocus} />
      </aside>
      <div
        className="fixed inset-x-0 bottom-0 z-[1050] max-h-[65vh] overflow-y-auto rounded-t-3xl border bg-white p-5 shadow-2xl xl:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Detail WebGIS"
      >
        <button
          onClick={onClose}
          aria-label="Tutup detail"
          className="float-right grid size-10 place-items-center rounded-lg hover:bg-slate-100"
        >
          <X className="size-5" />
        </button>
        <MapDetailContent selection={selection} onFocus={onFocus} />
      </div>
    </>
  );
}
