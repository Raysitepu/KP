import type { Earthquake } from "@/types/earthquake";
import type { WeatherResponse } from "@/types/weather";
import type { WeatherWarning } from "@/types/warning";
export type MapSelection =
  | { type: "weather"; value: WeatherResponse }
  | { type: "earthquake"; value: Earthquake & { distanceKm?: number | null } }
  | { type: "warning"; value: WeatherWarning };
