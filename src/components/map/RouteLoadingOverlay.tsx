"use client";

import { LoaderCircle } from "lucide-react";

export function RouteLoadingOverlay({ stage }: { stage: string | null }) {
  if (!stage) return null;
  return (
    <div className="absolute inset-0 z-[900] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-2xl">
        <LoaderCircle className="size-5 animate-spin text-[#1d5fa3]" />
        {stage}
      </div>
    </div>
  );
}
