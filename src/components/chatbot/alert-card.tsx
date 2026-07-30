import { AlertTriangle, Clock3, MapPinned } from "lucide-react";
import type { WeatherWarning } from "@/types/warning";

const format = (value: string | null, timezone: string) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timezone,
      }).format(new Date(value))
    : "Tidak tersedia";

export function AlertCard({
  alerts,
  timezone,
}: {
  alerts: WeatherWarning[];
  timezone: string;
}) {
  if (!alerts.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {alerts.slice(0, 3).map((alert, index) => (
        <article
          key={alert.identifier ?? `${alert.sent}-${index}`}
          className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-950"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-700" />
            <div>
              <p className="text-sm font-extrabold">
                {alert.headline ?? alert.event ?? "Peringatan dini cuaca"}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-xs">
                <Clock3 className="mt-0.5 size-3.5 shrink-0" />
                Berlaku sampai {format(alert.expires, timezone)}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-xs">
                <MapPinned className="mt-0.5 size-3.5 shrink-0" />
                {alert.areas
                  .map((area) => area.description)
                  .filter(Boolean)
                  .join(", ") || "Wilayah tidak tersedia"}
              </p>
              {alert.instruction && (
                <p className="mt-2 text-xs leading-relaxed">
                  {alert.instruction}
                </p>
              )}
              <p className="mt-2 text-[10px] font-bold text-orange-700">
                Sumber: BMKG
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
