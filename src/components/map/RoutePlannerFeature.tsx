"use client";

import dynamic from "next/dynamic";
import { ListTree } from "lucide-react";
import { useRoutePlanner } from "@/hooks/use-route-planner";
import { Skeleton } from "@/components/ui/states";
import { RoutePlannerPanel } from "./RoutePlannerPanel";
import { RouteWeatherSummary } from "./RouteWeatherSummary";

const RouteMap = dynamic(() => import("./RouteWeatherMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[520px] md:h-[650px]" />,
});

export function RoutePlannerFeature() {
  const planner = useRoutePlanner();
  const { state } = planner;
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <RoutePlannerPanel planner={planner} />
        {state.route?.steps.length ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ListTree className="size-4 text-[#2d6f9f]" />
              <h3 className="text-sm font-black">Petunjuk perjalanan</h3>
            </div>
            <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto text-xs text-slate-600">
              {state.route.steps.slice(0, 80).map((step, index) => (
                <li
                  key={`${step.instruction}-${index}`}
                  className="flex gap-2 border-b pb-2 last:border-0"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-black">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="text-slate-800">
                      {step.instruction}
                    </strong>
                    <br />
                    {(step.distanceMeters / 1_000).toFixed(1)} km ·{" "}
                    {Math.round(step.durationSeconds / 60)} menit
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
      <div className="min-w-0 space-y-5">
        <RouteMap planner={planner} />
        {state.route && state.origin && state.destination && (
          <RouteWeatherSummary
            route={state.route}
            points={state.weatherPoints}
            summary={state.summary}
            origin={state.origin}
            destination={state.destination}
            departureTime={state.departureTime}
          />
        )}
      </div>
    </div>
  );
}
