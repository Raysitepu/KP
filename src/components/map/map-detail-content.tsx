"use client";
import { Copy, ExternalLink, LocateFixed } from "lucide-react";
import type { MapSelection } from "./map-selection";
import { isAllowedBmkgShakemapUrl } from "@/utils/earthquake";
const show = (value: unknown, suffix = "") =>
  value == null || value === "" ? "Tidak tersedia" : `${value}${suffix}`;
const Rows = ({ rows }: { rows: [string, unknown, string?][] }) => (
  <dl className="mt-4 divide-y text-sm">
    {rows.map(([label, value, suffix]) => (
      <div
        key={label}
        className="grid grid-cols-[minmax(110px,.8fr)_1.2fr] gap-3 py-2"
      >
        <dt className="text-slate-500">{label}</dt>
        <dd className="text-right font-semibold break-words">
          {show(value, suffix)}
        </dd>
      </div>
    ))}
  </dl>
);
export function MapDetailContent({
  selection,
  onFocus,
}: {
  selection: MapSelection;
  onFocus: () => void;
}) {
  if (selection.type === "weather") {
    const { location, current, fetchedAt } = selection.value;
    return (
      <>
        <p className="eyebrow">Detail cuaca</p>
        <h3 className="text-lg font-bold">{location.village}</h3>
        <Rows
          rows={[
            ["Kecamatan", location.district],
            ["Kabupaten/Kota", location.regency],
            ["Provinsi", location.province],
            ["ADM4", location.adm4],
            ["Latitude", location.latitude],
            ["Longitude", location.longitude],
            [
              "Waktu prakiraan",
              current ? `${current.date} ${current.time} WIB` : null,
            ],
            ["Kondisi", current?.weatherDescription],
            ["Suhu", current?.temperature, "°C"],
            ["Kelembapan", current?.humidity, "%"],
            ["Kecepatan angin", current?.windSpeed, " km/jam"],
            ["Arah angin", current?.windDirection],
            ["Tutupan awan", current?.cloudCover, "%"],
            ["Jarak pandang", current?.visibility],
            ["Data diambil", new Date(fetchedAt).toLocaleString("id-ID")],
          ]}
        />
      </>
    );
  }
  if (selection.type === "earthquake") {
    const item = selection.value;
    const validShakemap = isAllowedBmkgShakemapUrl(item.shakemapUrl);
    return (
      <>
        <p className="eyebrow">Detail gempa</p>
        <h3 className="text-lg font-bold">Gempa M{show(item.magnitude)}</h3>
        <Rows
          rows={[
            ["Kedalaman", item.depth],
            ["Tanggal", item.date],
            ["Waktu", item.time],
            ["Lokasi", item.region],
            ["Latitude", item.latitude],
            ["Longitude", item.longitude],
            ["Potensi tsunami", item.potential],
            ["Dirasakan", item.felt],
            [
              "Jarak wilayah aktif",
              item.distanceKm == null
                ? null
                : `${Math.round(item.distanceKm)} km`,
            ],
          ]}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={onFocus}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white"
          >
            <LocateFixed className="size-4" />
            Fokus peta
          </button>
          <button
            disabled={item.latitude == null || item.longitude == null}
            onClick={() =>
              navigator.clipboard.writeText(
                `${item.latitude}, ${item.longitude}`,
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold disabled:opacity-40"
          >
            <Copy className="size-4" />
            Salin koordinat
          </button>
          {validShakemap ? (
            <a
              href={item.shakemapUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
            >
              <ExternalLink className="size-4" />
              Lihat Shakemap BMKG
            </a>
          ) : (
            <p className="w-full text-sm text-slate-500">
              Shakemap tidak tersedia untuk kejadian ini.
            </p>
          )}
        </div>
      </>
    );
  }
  const item = selection.value;
  return (
    <>
      <p className="eyebrow">Detail peringatan dini</p>
      <h3 className="text-lg font-bold">{show(item.headline ?? item.event)}</h3>
      <Rows
        rows={[
          ["Event", item.event],
          ["Severity", item.severity],
          ["Urgency", item.urgency],
          ["Certainty", item.certainty],
          ["Mulai", item.effective],
          ["Berakhir", item.expires],
          ["Pengirim", item.senderName],
          [
            "Wilayah",
            item.areas
              .map((area) => area.description)
              .filter(Boolean)
              .join(", "),
          ],
          ["Deskripsi", item.description],
          ["Instruksi", item.instruction],
        ]}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onFocus}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white"
        >
          <LocateFixed className="size-4" />
          Fokus polygon
        </button>
        {item.web?.startsWith("https://www.bmkg.go.id") && (
          <a
            href={item.web}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
          >
            <ExternalLink className="size-4" />
            Sumber BMKG
          </a>
        )}
      </div>
    </>
  );
}
