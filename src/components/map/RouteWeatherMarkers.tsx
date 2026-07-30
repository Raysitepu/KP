"use client";

import { useMemo } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { weatherMarkerPresentation } from "@/lib/route-weather/weather-presentation";
import type { RouteWeatherPoint } from "@/types/route";
import { RouteWeatherPopup } from "./RouteWeatherPopup";

function WeatherMarker({
  point,
  selected,
  onSelect,
}: {
  point: RouteWeatherPoint;
  selected: boolean;
  onSelect: (point: RouteWeatherPoint) => void;
}) {
  const presentation = weatherMarkerPresentation(point.forecast, point.status);
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "route-weather-icon",
        html: `<span class="route-weather-pin ${point.status}${selected ? " selected" : ""}" aria-label="${presentation.label}"><b>${point.index + 1}</b><i>${presentation.symbol}</i></span>`,
        iconSize: [42, 48],
        iconAnchor: [21, 46],
        popupAnchor: [0, -42],
      }),
    [
      point.index,
      point.status,
      presentation.label,
      presentation.symbol,
      selected,
    ],
  );
  return (
    <Marker
      position={[point.latitude, point.longitude]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(point) }}
    >
      <Popup maxWidth={320}>
        <RouteWeatherPopup point={point} />
      </Popup>
    </Marker>
  );
}

export function RouteWeatherMarkers({
  points,
  selectedId,
  onSelect,
}: {
  points: RouteWeatherPoint[];
  selectedId: string | null;
  onSelect: (point: RouteWeatherPoint) => void;
}) {
  return points.map((point) => (
    <WeatherMarker
      key={point.id}
      point={point}
      selected={selectedId === point.id}
      onSelect={onSelect}
    />
  ));
}
