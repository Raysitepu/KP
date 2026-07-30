"use client";

import { useEffect } from "react";
import {
  MapContainer,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { ReturnTypeRoutePlanner } from "./route-planner-types";
import { DraggableLocationMarker } from "./DraggableLocationMarker";
import { RouteLoadingOverlay } from "./RouteLoadingOverlay";
import { RoutePolyline } from "./RoutePolyline";
import { RouteWeatherLegend } from "./RouteWeatherLegend";
import { RouteWeatherMarkers } from "./RouteWeatherMarkers";
import "leaflet/dist/leaflet.css";

const INDONESIA_CENTER: [number, number] = [-2.5, 118];

function MapSelection({ planner }: { planner: ReturnTypeRoutePlanner }) {
  useMapEvents({
    click: (event) => {
      if (!planner.state.selectionMode) return;
      void planner.setCoordinate(
        planner.state.selectionMode,
        event.latlng.lat,
        event.latlng.lng,
        "map",
      );
    },
  });
  return null;
}

function FitRoute({ planner }: { planner: ReturnTypeRoutePlanner }) {
  const map = useMap();
  const route = planner.state.route;
  useEffect(() => {
    if (route?.geometry.coordinates.length) {
      const bounds = L.latLngBounds(
        route.geometry.coordinates.map(
          ([longitude, latitude]) => [latitude, longitude] as [number, number],
        ),
      );
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
      return;
    }
    const points = [planner.state.origin, planner.state.destination].filter(
      Boolean,
    );
    if (points.length === 1)
      map.flyTo([points[0]!.latitude, points[0]!.longitude], 12);
    if (points.length === 2)
      map.fitBounds(
        points.map((point) => [point!.latitude, point!.longitude]),
        { padding: [35, 35] },
      );
  }, [map, planner.state.destination, planner.state.origin, route]);
  return null;
}

export default function RouteWeatherMap({
  planner,
}: {
  planner: ReturnTypeRoutePlanner;
}) {
  const { state } = planner;
  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm md:h-[650px]">
      <MapContainer
        center={INDONESIA_CENTER}
        zoom={5}
        minZoom={3}
        scrollWheelZoom
        className={`h-full w-full ${state.selectionMode ? "cursor-crosshair" : ""}`}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ScaleControl imperial={false} />
        <MapSelection planner={planner} />
        <FitRoute planner={planner} />
        {state.origin && (
          <DraggableLocationMarker
            kind="origin"
            location={state.origin}
            onChange={(latitude, longitude) =>
              void planner.setCoordinate("origin", latitude, longitude)
            }
          />
        )}
        {state.destination && (
          <DraggableLocationMarker
            kind="destination"
            location={state.destination}
            onChange={(latitude, longitude) =>
              void planner.setCoordinate("destination", latitude, longitude)
            }
          />
        )}
        {state.route && (
          <RoutePolyline
            geometry={state.route.geometry}
            totalDistanceMeters={state.route.distanceMeters}
            weatherPoints={state.weatherPoints}
          />
        )}
        <RouteWeatherMarkers
          points={state.weatherPoints}
          selectedId={state.selectedWeatherPointId}
          onSelect={(point) => planner.setSelectedWeatherPointId(point.id)}
        />
      </MapContainer>
      {state.selectionMode && (
        <p className="pointer-events-none absolute top-3 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-slate-950/85 px-4 py-2 text-xs font-bold text-white shadow-xl">
          Klik peta untuk memilih{" "}
          {state.selectionMode === "origin" ? "titik keberangkatan" : "tujuan"}
        </p>
      )}
      {state.route && <RouteWeatherLegend />}
      <RouteLoadingOverlay stage={state.loadingStage} />
    </div>
  );
}
