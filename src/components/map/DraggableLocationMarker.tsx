"use client";

import { useMemo } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { SelectedLocation } from "@/types/route";

export function DraggableLocationMarker({
  kind,
  location,
  onChange,
}: {
  kind: "origin" | "destination";
  location: SelectedLocation;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "route-location-icon",
        html: `<span class="route-location-pin ${kind}">${kind === "origin" ? "A" : "B"}</span>`,
        iconSize: [34, 42],
        iconAnchor: [17, 40],
        popupAnchor: [0, -36],
      }),
    [kind],
  );
  return (
    <Marker
      draggable
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        dragend: (event) => {
          const point = (event.target as L.Marker).getLatLng();
          onChange(point.lat, point.lng);
        },
      }}
    >
      <Popup>
        <strong>{kind === "origin" ? "Keberangkatan" : "Tujuan"}</strong>
        <br />
        {location.displayName}
        <br />
        <small>Marker dapat digeser.</small>
      </Popup>
    </Marker>
  );
}
