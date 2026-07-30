"use client";

import { useCallback, useState } from "react";
import type {
  LocationSearchResult,
  RoutePlannerState,
  RouteResult,
  SelectedLocation,
} from "@/types/route";
import { fetchRouteWeather } from "./use-route-weather";

function currentLocalInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function zonedLocalDateTimeToIso(value: string, timezone: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Waktu keberangkatan tidak valid.");
  const [, year, month, day, hour, minute] = match;
  const expectedUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let instant = expectedUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    instant += expectedUtc - represented;
  }
  return new Date(instant).toISOString();
}

const initialState = (): RoutePlannerState => ({
  selectionMode: null,
  origin: null,
  destination: null,
  departureTime: currentLocalInput(),
  route: null,
  weatherPoints: [],
  summary: null,
  selectedWeatherPointId: null,
  isCalculatingRoute: false,
  isLoadingWeather: false,
  loadingStage: null,
  error: null,
});

function selectedLocation(
  value: LocationSearchResult,
  source: SelectedLocation["source"],
): SelectedLocation {
  return { ...value, source };
}

export function useRoutePlanner() {
  const [state, setState] = useState<RoutePlannerState>(initialState);

  const invalidateRoute = useCallback(() => {
    setState((current) => ({
      ...current,
      route: null,
      weatherPoints: [],
      summary: null,
      selectedWeatherPointId: null,
      error: null,
    }));
  }, []);

  const setLocation = useCallback(
    (
      target: "origin" | "destination",
      value: LocationSearchResult,
      source: SelectedLocation["source"] = "search",
    ) => {
      setState((current) => ({
        ...current,
        [target]: selectedLocation(value, source),
        selectionMode: null,
        route: null,
        weatherPoints: [],
        summary: null,
        error: null,
      }));
    },
    [],
  );

  const setCoordinate = useCallback(
    async (
      target: "origin" | "destination",
      latitude: number,
      longitude: number,
      source: SelectedLocation["source"] = "map",
    ) => {
      const fallback: LocationSearchResult = {
        id: `${latitude},${longitude}`,
        displayName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
        type: "coordinate",
      };
      setLocation(target, fallback, source);
      try {
        const response = await fetch(
          `/api/locations/reverse?lat=${latitude}&lng=${longitude}`,
        );
        const body = (await response.json()) as {
          success?: boolean;
          location?: LocationSearchResult;
        };
        if (response.ok && body.success && body.location)
          setLocation(target, body.location, source);
      } catch {}
    },
    [setLocation],
  );

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((current) => ({
        ...current,
        error: "Browser tidak mendukung geolocation.",
      }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        void setCoordinate(
          "origin",
          coords.latitude,
          coords.longitude,
          "geolocation",
        ),
      (error) =>
        setState((current) => ({
          ...current,
          error:
            error.code === error.PERMISSION_DENIED
              ? "Izin lokasi ditolak. Pilih titik awal melalui pencarian atau peta."
              : "Lokasi perangkat belum dapat diperoleh.",
        })),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [setCoordinate]);

  const departureIso = useCallback(async () => {
    const origin = state.origin;
    if (!origin)
      throw new Error("Tentukan lokasi keberangkatan terlebih dahulu.");
    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const response = await fetch(
        `/api/regions/by-coordinate?lat=${origin.latitude}&lng=${origin.longitude}`,
      );
      const body = (await response.json()) as {
        region?: { timezone?: string };
      };
      if (body.region?.timezone) timezone = body.region.timezone;
    } catch {}
    return zonedLocalDateTimeToIso(state.departureTime, timezone);
  }, [state.departureTime, state.origin]);

  const calculate = useCallback(async () => {
    if (!state.origin || !state.destination) {
      setState((current) => ({
        ...current,
        error: "Tentukan lokasi keberangkatan dan tujuan terlebih dahulu.",
      }));
      return;
    }
    setState((current) => ({
      ...current,
      isCalculatingRoute: true,
      isLoadingWeather: false,
      loadingStage: "Mencari rute...",
      error: null,
      route: null,
      weatherPoints: [],
      summary: null,
    }));
    try {
      const departureTime = await departureIso();
      const response = await fetch("/api/routes/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: state.origin,
          destination: state.destination,
          departureTime,
          profile: "driving",
        }),
      });
      const body = (await response.json()) as {
        success?: boolean;
        route?: RouteResult;
        message?: string;
      };
      if (!response.ok || !body.success || !body.route)
        throw new Error(body.message ?? "Rute belum dapat dihitung.");
      const route = body.route;
      setState((current) => ({
        ...current,
        route,
        isCalculatingRoute: false,
        isLoadingWeather: true,
        loadingStage: "Mencocokkan wilayah dan mengambil prakiraan BMKG...",
      }));
      try {
        const weather = await fetchRouteWeather(route, departureTime);
        setState((current) => ({
          ...current,
          route,
          weatherPoints: weather.points,
          summary: weather.summary,
          isLoadingWeather: false,
          loadingStage: null,
          error: weather.partial ? weather.message : null,
        }));
      } catch (error) {
        setState((current) => ({
          ...current,
          route,
          isLoadingWeather: false,
          loadingStage: null,
          error:
            error instanceof Error
              ? error.message
              : "Data cuaca rute belum dapat diambil. Rute tetap ditampilkan.",
        }));
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        isCalculatingRoute: false,
        isLoadingWeather: false,
        loadingStage: null,
        error:
          error instanceof Error ? error.message : "Rute belum dapat dihitung.",
      }));
    }
  }, [departureIso, state.destination, state.origin]);

  return {
    state,
    setLocation,
    clearLocation: (target: "origin" | "destination") =>
      setState((current) => ({
        ...current,
        [target]: null,
        route: null,
        weatherPoints: [],
        summary: null,
        error: null,
      })),
    setCoordinate,
    useMyLocation,
    invalidateRoute,
    calculate,
    setSelectionMode: (mode: RoutePlannerState["selectionMode"]) =>
      setState((current) => ({ ...current, selectionMode: mode })),
    setDepartureTime: (departureTime: string) =>
      setState((current) => ({
        ...current,
        departureTime,
        route: null,
        weatherPoints: [],
        summary: null,
        error: null,
      })),
    setSelectedWeatherPointId: (selectedWeatherPointId: string | null) =>
      setState((current) => ({ ...current, selectedWeatherPointId })),
    swapLocations: () =>
      setState((current) => ({
        ...current,
        origin: current.destination
          ? { ...current.destination, source: "search" }
          : null,
        destination: current.origin
          ? { ...current.origin, source: "search" }
          : null,
        route: null,
        weatherPoints: [],
        summary: null,
        error: null,
      })),
    clear: () => setState(initialState()),
  };
}
