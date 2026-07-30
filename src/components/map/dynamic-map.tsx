"use client";
import dynamic from "next/dynamic";
import type { WeatherResponse } from "@/types/weather";
import type { WarningResponse } from "@/types/warning";
import type { WeatherWarning } from "@/types/warning";
import type { FilteredEarthquake } from "@/hooks/use-earthquake-filters";
import { Skeleton } from "@/components/ui/states";
const Map = dynamic(() => import("./weather-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[380px] md:h-[520px]" />,
});
export function DynamicMap(props: {
  weather?: WeatherResponse;
  earthquakes: FilteredEarthquake[];
  selectedEarthquake?: FilteredEarthquake | null;
  warning?: WarningResponse;
  warningFocus?: number;
  onSelectWeather: () => void;
  onSelectEarthquake: (item: FilteredEarthquake) => void;
  onSelectWarning: (item: WeatherWarning) => void;
  focusCommand?: { type: "selected" | "warnings"; id: number } | null;
}) {
  return <Map {...props} />;
}
