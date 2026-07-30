"use client";

import { useState } from "react";

export function MagnitudeInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min="0"
        max="10"
        step="0.1"
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (next === "") return;
          const numeric = Number(next);
          if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 10)
            onChange(numeric);
        }}
        className={
          className ?? "mt-1 min-h-11 w-full rounded-lg border bg-white px-3"
        }
      />
    </label>
  );
}
