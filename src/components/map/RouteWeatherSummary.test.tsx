import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteWeatherSummary } from "./RouteWeatherSummary";
import type {
  RouteResult,
  RouteWeatherPoint,
  RouteWeatherSummary as Summary,
  SelectedLocation,
} from "@/types/route";

const origin: SelectedLocation = {
  id: "origin",
  displayName: "Medan, Sumatera Utara",
  latitude: 3.5952,
  longitude: 98.6722,
  source: "search",
};

const destination: SelectedLocation = {
  id: "destination",
  displayName: "Berastagi, Sumatera Utara",
  latitude: 3.1947,
  longitude: 98.5089,
  source: "search",
};

const route: RouteResult = {
  distanceMeters: 66_800,
  durationSeconds: 6_840,
  geometry: {
    type: "LineString",
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
  },
  steps: [],
};

function point(
  id: string,
  index: number,
  villageName: string,
  description: string,
): RouteWeatherPoint {
  return {
    id,
    index,
    latitude: index ? destination.latitude : origin.latitude,
    longitude: index ? destination.longitude : origin.longitude,
    distanceFromOriginKm: index ? 66.8 : 0,
    durationFromOriginMinutes: index ? 114 : 0,
    estimatedArrivalTime: index
      ? "2026-07-22T07:24:00.000Z"
      : "2026-07-22T05:30:00.000Z",
    region: {
      adm1: "12",
      adm2: "12.01",
      adm3: "12.01.01",
      adm4: `12.01.01.100${index + 1}`,
      provinceName: "Sumatera Utara",
      regencyName: index ? "Kabupaten Karo" : "Kota Medan",
      districtName: index ? "Berastagi" : "Medan Kota",
      villageName,
      timezone: "Asia/Jakarta",
      matchedBy: "polygon",
    },
    forecast: {
      datetime: index ? "2026-07-22T07:00:00.000Z" : "2026-07-22T05:00:00.000Z",
      utcDatetime: null,
      localDatetime: index ? "2026-07-22 14:00:00" : "2026-07-22 12:00:00",
      date: "2026-07-22",
      time: index ? "14:00" : "12:00",
      temperature: index ? 20 : 30,
      humidity: 80,
      weatherDescription: description,
      weatherDescriptionEn: null,
      windSpeed: 8,
      windDirection: "SE",
      cloudCover: 70,
      visibility: "10 km",
      iconUrl: null,
      analysisDate: "2026-07-22T00:00:00.000Z",
    },
    forecastStatus: "available",
    status: index ? "rain" : "normal",
    staleCache: false,
  };
}

describe("RouteWeatherSummary", () => {
  it("menampilkan ringkasan dan kondisi setiap titik perjalanan", () => {
    const points = [
      point("route-point-1", 0, "Pusat Pasar", "Cerah Berawan"),
      point("route-point-2", 1, "Gundaling I", "Hujan Ringan"),
    ];
    const summary: Summary = {
      rainPointCount: 1,
      firstRainDistanceKm: 66.8,
      worstCondition: "Hujan Ringan",
      worstPointId: "route-point-2",
      minimumTemperature: 20,
      maximumTemperature: 30,
      maximumWindSpeed: 8,
      unavailablePointCount: 0,
    };

    render(
      <RouteWeatherSummary
        route={route}
        points={points}
        summary={summary}
        origin={origin}
        destination={destination}
        departureTime="2026-07-22T05:30:00.000Z"
      />,
    );

    expect(screen.getByText("Cuaca setiap titik perjalanan")).toBeTruthy();
    expect(screen.getByText("Pusat Pasar")).toBeTruthy();
    expect(screen.getByText("Gundaling I")).toBeTruthy();
    expect(screen.getByText("1 titik hujan")).toBeTruthy();
    expect(screen.getByText("Berdasarkan prakiraan BMKG")).toBeTruthy();
  });
});
