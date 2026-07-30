"use client";

import { CalendarClock } from "lucide-react";

export function DepartureTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-extrabold text-slate-700">
      Waktu keberangkatan
      <span className="relative mt-1.5 block">
        <CalendarClock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="datetime-local"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm outline-none focus:border-[#2d6f9f]"
        />
      </span>
    </label>
  );
}
