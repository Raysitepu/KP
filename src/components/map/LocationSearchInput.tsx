"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import type { LocationSearchResult, SelectedLocation } from "@/types/route";

export function LocationSearchInput({
  id,
  label,
  value,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  value: SelectedLocation | null;
  onSelect: (location: LocationSearchResult) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const query = draft ?? value?.displayName ?? "";

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3 || query === value?.displayName) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/locations/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as {
          results?: LocationSearchResult[];
        };
        setResults(body.results ?? []);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value?.displayName]);

  return (
    <div ref={root} className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-extrabold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          value={query}
          autoComplete="off"
          onFocus={() => results.length && setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (next.trim().length < 3) {
              setResults([]);
              setLoading(false);
              setOpen(false);
            }
          }}
          placeholder="Cari kota, jalan, atau tempat..."
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-9 text-sm outline-none focus:border-[#2d6f9f]"
        />
        {loading ? (
          <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-[#2d6f9f]" />
        ) : query ? (
          <button
            type="button"
            aria-label={`Hapus ${label.toLocaleLowerCase("id-ID")}`}
            onClick={() => {
              setDraft("");
              setResults([]);
              setOpen(false);
              onClear();
            }}
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-slate-400"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {open && (
        <div className="absolute top-full right-0 left-0 z-[1000] mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {results.length ? (
            results.map((result) => (
              <button
                type="button"
                key={result.id}
                onClick={() => {
                  onSelect(result);
                  setDraft(null);
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 rounded-lg p-2.5 text-left text-xs hover:bg-slate-100"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#2d6f9f]" />
                <span className="leading-relaxed">{result.displayName}</span>
              </button>
            ))
          ) : (
            <p className="p-3 text-xs text-slate-500">
              Lokasi belum ditemukan.
            </p>
          )}
          <p className="border-t p-2 text-[10px] text-slate-400">
            Pencarian © OpenStreetMap contributors
          </p>
        </div>
      )}
    </div>
  );
}
