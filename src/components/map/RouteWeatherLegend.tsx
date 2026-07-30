import type { RouteWeatherStatus } from "@/types/route";

const items: { status: RouteWeatherStatus; symbol: string; label: string }[] = [
  { status: "normal", symbol: "☀", label: "Normal: cerah/berawan" },
  { status: "rain", symbol: "☂", label: "Terdapat hujan" },
  { status: "caution", symbol: "!", label: "Perlu perhatian" },
  { status: "warning", symbol: "⚡", label: "Cuaca signifikan" },
  { status: "unknown", symbol: "?", label: "Data tidak tersedia" },
];

export function RouteWeatherLegend() {
  return (
    <aside className="absolute right-3 bottom-6 z-[500] w-52 rounded-xl bg-white/95 p-3 text-[11px] shadow-xl backdrop-blur">
      <p className="font-black text-slate-800">Legenda cuaca rute</p>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => (
          <p key={item.status} className="flex items-center gap-2">
            <span className={`route-legend-symbol ${item.status}`}>
              {item.symbol}
            </span>
            {item.label}
          </p>
        ))}
      </div>
      <p className="mt-2 border-t pt-2 text-slate-500">
        Warna bukan jaminan keselamatan perjalanan.
      </p>
    </aside>
  );
}
