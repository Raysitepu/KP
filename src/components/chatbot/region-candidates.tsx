import { MapPin } from "lucide-react";
import type { RegionCandidate } from "@/types/regions";

export function RegionCandidates({
  candidates,
  disabled,
  onSelect,
}: {
  candidates: RegionCandidate[];
  disabled: boolean;
  onSelect: (candidate: RegionCandidate) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {candidates.map((candidate) => (
        <button
          key={candidate.adm4}
          disabled={disabled}
          onClick={() => onSelect(candidate)}
          className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left transition hover:border-[#55a47a] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#1d5fa3]" />
          <span className="min-w-0">
            <strong className="block text-sm text-slate-900">
              {candidate.level === "regency"
                ? `Ringkasan umum ${candidate.regencyName}`
                : candidate.level === "district"
                  ? `Kecamatan ${candidate.districtName}`
                  : candidate.villageName}
            </strong>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
              {candidate.level === "regency"
                ? "Gambaran dari beberapa wilayah perwakilan"
                : candidate.level === "district"
                  ? `${candidate.regencyName} · pilih untuk melihat desa/kelurahan`
                  : `Kecamatan ${candidate.districtName}, ${candidate.regencyName}`}
            </span>
            {candidate.level === "village" ? (
              <span className="mt-1 block font-mono text-[10px] text-slate-400">
                {candidate.adm4}
              </span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}
