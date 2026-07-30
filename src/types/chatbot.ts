import type { NormalizedForecast } from "@/types/weather";
import type {
  RegionCandidate,
  RegionLevel,
  RegionRecord,
} from "@/types/regions";
import type { WeatherWarning } from "@/types/warning";

export type WeatherIntent =
  | "current_weather"
  | "weather_forecast"
  | "rain_forecast"
  | "temperature"
  | "humidity"
  | "wind"
  | "visibility"
  | "cloud_cover"
  | "weather_warning"
  | "outdoor_recommendation"
  | "compare_locations"
  | "unknown";

export type DayReference = "today" | "tomorrow" | "day_after_tomorrow";
export type TimePeriod = "dawn" | "morning" | "noon" | "afternoon" | "evening";

export type ParsedWeatherIntent = {
  intent: WeatherIntent;
  day: DayReference;
  dayOffset: 0 | 1 | 2;
  period: TimePeriod | null;
  asksThreeDays: boolean;
  wantsDetail: boolean;
  isDynamic: boolean;
};

export type SelectedRegionInput = Pick<
  RegionRecord,
  | "provinceCode"
  | "provinceName"
  | "regencyCode"
  | "regencyName"
  | "districtCode"
  | "districtName"
  | "villageCode"
  | "villageName"
  | "adm1"
  | "adm2"
  | "adm3"
  | "adm4"
  | "latitude"
  | "longitude"
  | "timezone"
  | "normalizedName"
  | "aliases"
> & {
  level?: RegionLevel;
};

export type WeatherChatRequest = {
  message: string;
  conversationId?: string;
  selectedRegion?: SelectedRegionInput | null;
  fallbackRegion?: SelectedRegionInput | null;
};

export type WeatherChatResponse = {
  success: boolean;
  conversationId: string;
  intent: WeatherIntent;
  location: RegionCandidate | null;
  answer: string;
  message?: string;
  forecast: NormalizedForecast[];
  alerts: WeatherWarning[];
  suggestions: string[];
  regionalSummary?: RegionalWeatherSummary | null;
  requiresLocationSelection?: boolean;
  candidates?: RegionCandidate[];
  errorCode?: string;
};

export type RegionalWeatherSample = {
  adm4: string;
  districtName: string;
  villageName: string;
  conditions: string[];
  minimumTemperature: number | null;
  maximumTemperature: number | null;
  maximumWindSpeed: number | null;
  hasRain: boolean;
  forecastTime: string | null;
};

export type RegionalWeatherSummary = {
  regencyCode: string;
  regencyName: string;
  context: string;
  sampledAreaCount: number;
  availableAreaCount: number;
  unavailableAreaCount: number;
  rainAreaCount: number;
  conditions: { description: string; areaCount: number }[];
  minimumTemperature: number | null;
  maximumTemperature: number | null;
  maximumWindSpeed: number | null;
  samples: RegionalWeatherSample[];
  generatedAt: string;
};

export type ConversationState = {
  conversationId: string;
  region: RegionCandidate | null;
  lastIntent: WeatherIntent | null;
  lastDay: DayReference | null;
  lastPeriod: TimePeriod | null;
  pendingMessage: string | null;
  candidates: RegionCandidate[];
  updatedAt: string;
};

export type WeatherChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: WeatherChatResponse;
};
