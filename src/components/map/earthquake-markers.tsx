"use client";
import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import type { FilteredEarthquake } from "@/hooks/use-earthquake-filters";

export function earthquakeColor(magnitude: number | null) {
  return magnitude == null || magnitude < 4
    ? "#eab308"
    : magnitude < 5
      ? "#f97316"
      : "#dc2626";
}
const icon = (item: FilteredEarthquake, selected: boolean) => {
  const size = Math.max(24, Math.min(42, 22 + (item.magnitude ?? 3) * 3));
  const color = earthquakeColor(item.magnitude);
  return L.divIcon({
    className: "map-pin",
    html: `<span aria-label="Gempa M${item.magnitude ?? "?"}" style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:${selected ? 4 : 2}px solid ${selected ? "#172554" : "white"};color:white;font-size:10px;font-weight:900;box-shadow:0 2px 8px #0006">${item.magnitude ?? "?"}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
type Cluster = {
  key: string;
  items: FilteredEarthquake[];
  latitude: number;
  longitude: number;
};
export function clusterEarthquakes(items: FilteredEarthquake[]): Cluster[] {
  const valid = items.filter(
    (item) => item.latitude != null && item.longitude != null,
  );
  if (valid.length <= 8)
    return valid.map((item) => ({
      key: item.id,
      items: [item],
      latitude: item.latitude!,
      longitude: item.longitude!,
    }));
  const groups = new Map<string, FilteredEarthquake[]>();
  valid.forEach((item) => {
    const key = `${Math.round(item.latitude! / 2)}:${Math.round(item.longitude! / 2)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return [...groups.entries()].map(([key, members]) => ({
    key,
    items: members,
    latitude:
      members.reduce((sum, item) => sum + item.latitude!, 0) / members.length,
    longitude:
      members.reduce((sum, item) => sum + item.longitude!, 0) / members.length,
  }));
}
function ClusterMarker({
  cluster,
  onSelect,
  selectedId,
}: {
  cluster: Cluster;
  onSelect: (item: FilteredEarthquake) => void;
  selectedId?: string;
}) {
  const map = useMap();
  if (cluster.items.length === 1) {
    const item = cluster.items[0];
    return (
      <Marker
        position={[cluster.latitude, cluster.longitude]}
        icon={icon(item, item.id === selectedId)}
        eventHandlers={{
          click: () => {
            onSelect(item);
            map.flyTo(
              [cluster.latitude, cluster.longitude],
              Math.max(map.getZoom(), 7),
            );
          },
        }}
      >
        <Popup>
          <strong>Gempa M{item.magnitude ?? "–"}</strong>
          <br />
          {item.region}
          <br />
          {item.date} {item.time}
          <br />
          Kedalaman {item.depth}
          <br />
          {item.potential}
          <br />
          {item.latitude}, {item.longitude}
        </Popup>
      </Marker>
    );
  }
  const clusterIcon = L.divIcon({
    className: "map-pin",
    html: `<span style="display:grid;place-items:center;width:42px;height:42px;border-radius:999px;background:#1e3a8a;border:3px solid white;color:white;font-weight:900;box-shadow:0 2px 8px #0006">${cluster.items.length}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
  return (
    <Marker
      position={[cluster.latitude, cluster.longitude]}
      icon={clusterIcon}
      eventHandlers={{
        click: () =>
          map.fitBounds(
            cluster.items.map(
              (item) => [item.latitude!, item.longitude!] as [number, number],
            ),
            { padding: [40, 40], maxZoom: 9 },
          ),
      }}
    >
      <Popup>
        Cluster {cluster.items.length} gempa. Klik untuk memperbesar.
      </Popup>
    </Marker>
  );
}
export function EarthquakeMarkers({
  items,
  selectedId,
  onSelect,
}: {
  items: FilteredEarthquake[];
  selectedId?: string;
  onSelect: (item: FilteredEarthquake) => void;
}) {
  return (
    <>
      {clusterEarthquakes(items).map((cluster) => (
        <ClusterMarker
          key={cluster.key}
          cluster={cluster}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
