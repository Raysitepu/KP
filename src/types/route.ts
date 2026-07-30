import type { NormalizedForecast } from "@/types/weather";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type SelectedLocation = Coordinate & {
  id: string;
  displayName: string;
  source: "search" | "map" | "geolocation";
};

export type RouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RouteStep = {
  distanceMeters: number;
  durationSeconds: number;
  name: string;
  instruction: string;
  mode: string;
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: RouteGeometry;
  steps: RouteStep[];
};

export type SampledRoutePoint = Coordinate & {
  id: string;
  index: number;
  distanceFromOriginKm: number;
  durationFromOriginMinutes: number;
  estimatedArrivalTime: string;
};

export type AdministrativeRegion = {
  adm1: string | null;
  adm2: string | null;
  adm3: string | null;
  adm4: string;
  provinceName: string;
  regencyName: string;
  districtName: string;
  villageName: string;
  timezone: string;
  matchedBy: "polygon" | "centroid";
};

export type RouteWeatherStatus =
  "normal" | "rain" | "caution" | "warning" | "unknown";

export type RouteWeatherPoint = SampledRoutePoint & {
  region: AdministrativeRegion | null;
  forecast: NormalizedForecast | null;
  forecastStatus: "available" | "unavailable";
  status: RouteWeatherStatus;
  staleCache: boolean;
};

export type RouteWeatherSummary = {
  rainPointCount: number;
  firstRainDistanceKm: number | null;
  worstCondition: string | null;
  worstPointId: string | null;
  minimumTemperature: number | null;
  maximumTemperature: number | null;
  maximumWindSpeed: number | null;
  unavailablePointCount: number;
};

export type RouteWeatherResponse = {
  success: boolean;
  points: RouteWeatherPoint[];
  summary: RouteWeatherSummary;
  partial: boolean;
  message: string;
};

export type LocationSearchResult = Coordinate & {
  id: string;
  displayName: string;
  type: string;
};

export type RoutePlannerState = {
  selectionMode: "origin" | "destination" | null;
  origin: SelectedLocation | null;
  destination: SelectedLocation | null;
  departureTime: string;
  route: RouteResult | null;
  weatherPoints: RouteWeatherPoint[];
  summary: RouteWeatherSummary | null;
  selectedWeatherPointId: string | null;
  isCalculatingRoute: boolean;
  isLoadingWeather: boolean;
  loadingStage: string | null;
  error: string | null;
};
