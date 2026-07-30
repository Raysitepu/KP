"use client";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useWarning } from "@/hooks/use-warning";
import type { Region } from "@/types/weather";

const format = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value))
    : "Tidak tersedia";
const safeBmkgUrl = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "bmkg.go.id" || url.hostname.endsWith(".bmkg.go.id"))
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function matchesRegion(descriptions: Array<string | null>, region?: Region) {
  if (!region) return false;
  const haystack = normalize(descriptions.filter(Boolean).join(" "));
  return [region.village, region.district, region.regency].some((name) =>
    haystack.includes(normalize(name)),
  );
}

function remaining(expires: string | null) {
  if (!expires) return "Waktu berakhir belum tersedia";
  const minutes = Math.ceil(
    (new Date(expires).getTime() - Date.now()) / 60_000,
  );
  if (minutes <= 0) return "Masa berlaku berakhir";
  if (minutes < 60) return `${minutes} menit tersisa`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam ${minutes % 60} menit tersisa`;
}

export function WarningPanel({
  onFocus,
  region,
}: {
  onFocus: () => void;
  region?: Region;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const query = useWarning();
  if (query.isLoading) return <Skeleton className="h-48" />;
  if (query.isError)
    return (
      <ErrorState
        message="Data peringatan dini BMKG belum dapat dimuat. Silakan coba kembali beberapa saat lagi."
        retry={() => query.refetch()}
      />
    );
  const data = query.data;
  if (!data || data.status === "unavailable")
    return (
      <ErrorState
        message={
          data?.message ?? "Data peringatan dini BMKG belum dapat dimuat."
        }
        retry={() => query.refetch()}
      />
    );
  if (data.status === "none")
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <div className="flex gap-4">
          <CheckCircle2 className="size-6 shrink-0 text-emerald-700" />
          <div>
            <p className="eyebrow !text-emerald-700">Feed peringatan BMKG</p>
            <h2 className="section-title">Tidak ada peringatan aktif</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-950">
              {data.message}
            </p>
            <p className="mt-2 text-xs text-emerald-800">
              Diperiksa: {format(data.checkedAt)}. Status ini bukan pernyataan
              bahwa wilayah aman.
            </p>
          </div>
        </div>
      </Card>
    );
  return (
    <section className="space-y-4" aria-labelledby="warning-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow !text-orange-700">
            Peringatan dini aktif • BMKG
          </p>
          <h2 id="warning-heading" className="section-title">
            {data.warnings.length} peringatan Sumatera Utara
          </h2>
        </div>
        {data.warnings.some((item) =>
          item.areas.some((area) => area.polygons.length),
        ) && (
          <button
            onClick={onFocus}
            className="min-h-11 rounded-xl bg-orange-700 px-4 text-sm font-semibold text-white"
          >
            Fit semua area di peta
          </button>
        )}
      </div>
      <div className="grid gap-4">
        {[...data.warnings]
          .sort(
            (left, right) =>
              Number(
                matchesRegion(
                  right.areas.map((area) => area.description),
                  region,
                ),
              ) -
              Number(
                matchesRegion(
                  left.areas.map((area) => area.description),
                  region,
                ),
              ),
          )
          .map((warning, index) => {
            const web = safeBmkgUrl(warning.web);
            const key = warning.identifier ?? `${warning.sent}-${index}`;
            const isExpanded = expanded === key;
            const local = matchesRegion(
              warning.areas.map((area) => area.description),
              region,
            );
            return (
              <Card
                key={key}
                className="overflow-hidden border-orange-300 bg-orange-50 !p-0"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`warning-detail-${index}`}
                  onClick={() => setExpanded(isExpanded ? null : key)}
                  className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-orange-100/60 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-orange-700"
                >
                  <span className="shrink-0 rounded-xl bg-orange-600 p-3 text-white">
                    <AlertTriangle />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-2 flex flex-wrap gap-2 text-xs font-bold">
                      {local && (
                        <span className="rounded-full bg-red-700 px-2.5 py-1 text-white">
                          Mencakup wilayah aktif
                        </span>
                      )}
                      <span className="rounded-full bg-orange-200 px-2.5 py-1">
                        {warning.severity ?? "Severity tidak tersedia"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1">
                        {warning.urgency ?? "Urgency tidak tersedia"}
                      </span>
                    </span>
                    <span className="block text-lg font-bold text-orange-950">
                      {warning.headline ??
                        warning.event ??
                        "Peringatan dini cuaca"}
                    </span>
                    <span className="mt-2 block text-sm text-orange-800">
                      Berlaku {format(warning.effective)} sampai{" "}
                      {format(warning.expires)}
                    </span>
                    <span className="mt-1 block text-xs font-bold text-orange-900">
                      {remaining(warning.expires)}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-2 size-5 shrink-0 text-orange-800 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {isExpanded && (
                  <div
                    id={`warning-detail-${index}`}
                    className="border-t border-orange-200 px-5 pb-5"
                  >
                    {warning.description && (
                      <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-orange-950">
                        {warning.description}
                      </p>
                    )}
                    {warning.instruction && (
                      <div className="mt-4 rounded-xl bg-white/70 p-4">
                        <h4 className="font-bold">Instruksi BMKG</h4>
                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                          {warning.instruction}
                        </p>
                      </div>
                    )}
                    <div className="mt-4">
                      <h4 className="text-sm font-bold">Wilayah terdampak</h4>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {warning.areas.map((area, areaIndex) => (
                          <li key={`${area.description}-${areaIndex}`}>
                            {area.description ??
                              "Deskripsi wilayah tidak tersedia"}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {web && (
                      <a
                        href={web}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-700 px-4 text-sm font-semibold text-orange-900"
                      >
                        Informasi BMKG <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
      </div>
    </section>
  );
}
