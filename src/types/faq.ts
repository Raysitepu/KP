import type { Earthquake } from "./earthquake";
import type { WeatherResponse } from "./weather";
import type { WarningResponse } from "./warning";

export type FaqAction =
  | "GET_ACTIVE_LOCATION"
  | "GET_CURRENT_WEATHER"
  | "GET_CURRENT_TEMPERATURE"
  | "GET_CURRENT_HUMIDITY"
  | "GET_CURRENT_WIND"
  | "GET_NEXT_FORECAST"
  | "GET_LATEST_EARTHQUAKE"
  | "GET_LATEST_EARTHQUAKE_MAGNITUDE"
  | "GET_LATEST_EARTHQUAKE_TSUNAMI_STATUS"
  | "GET_WARNING_STATUS"
  | "GET_LAST_UPDATED"
  | "OPEN_MAP_HELP"
  | "OPEN_WEATHER_DETAILS"
  | "OPEN_EARTHQUAKE_DETAILS";
export type FaqEntry = {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer?: string;
  suggestions?: string[];
  action?: FaqAction;
};
export type FaqApplicationState = {
  weather?: WeatherResponse;
  latestEarthquake?: Earthquake;
  warning?: WarningResponse;
  lastUpdated?: string;
};
export type FaqResult = {
  answer: string;
  suggestions: string[];
  confidence: number;
  matchedId: string | null;
  action?: FaqAction;
};
