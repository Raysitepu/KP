"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Expand,
  Minimize2,
  Layers3,
  LocateFixed,
  RotateCcw,
  X,
} from "lucide-react";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { WeatherResponse } from "@/types/weather";
import type { WarningResponse, WeatherWarning } from "@/types/warning";
import type { FilteredEarthquake } from "@/hooks/use-earthquake-filters";
import { EarthquakeMarkers } from "./earthquake-markers";
import "leaflet/dist/leaflet.css";

const SUMUT_CENTER: [number, number] = [2.8, 99];
const basemaps = {
  osm: {
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  topo: {
    label: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap contributors",
  },
  esri: {
    label: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  dark: {
    label: "CARTO Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
} as const;
type BasemapKey = keyof typeof basemaps;
type MapCommand = {
  type: "reset" | "weather" | "earthquakes" | "selected" | "warnings";
  id: number;
} | null;
const weatherIcon = L.divIcon({
  className: "map-pin",
  html: "<span class='map-pin-dot map-pin-weather'></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapFocus({
  weather,
  earthquakes,
  selected,
  warning,
  warningFocus,
  command,
}: {
  weather?: WeatherResponse;
  earthquakes: FilteredEarthquake[];
  selected?: FilteredEarthquake | null;
  warning?: WarningResponse;
  warningFocus?: number;
  command: MapCommand;
}) {
  const map = useMap();
  const warningPoints = useMemo(
    () =>
      warning?.warnings.flatMap((item) =>
        item.areas.flatMap((area) => area.polygons.flat()),
      ) ?? [],
    [warning],
  );
  useEffect(() => {
    if (warningFocus && warningPoints.length)
      map.fitBounds(warningPoints, { padding: [30, 30] });
  }, [warningFocus, map, warningPoints]);
  useEffect(() => {
    if (!command) return;
    if (command.type === "reset") map.flyTo(SUMUT_CENTER, 7);
    if (
      command.type === "weather" &&
      weather?.location.latitude != null &&
      weather.location.longitude != null
    )
      map.flyTo([weather.location.latitude, weather.location.longitude], 11);
    if (
      command.type === "selected" &&
      selected?.latitude != null &&
      selected.longitude != null
    )
      map.flyTo(
        [selected.latitude, selected.longitude],
        Math.max(map.getZoom(), 7),
      );
    if (command.type === "earthquakes") {
      const points = earthquakes.flatMap((item) =>
        item.latitude != null && item.longitude != null
          ? [[item.latitude, item.longitude] as [number, number]]
          : [],
      );
      if (points.length)
        map.fitBounds(points, { padding: [35, 35], maxZoom: 9 });
    }
    if (command.type === "warnings" && warningPoints.length)
      map.fitBounds(warningPoints, { padding: [35, 35] });
  }, [command, map, weather, selected, earthquakes, warningPoints]);
  return null;
}

export default function WeatherMap({
  weather,
  earthquakes,
  selectedEarthquake,
  warning,
  warningFocus,
  onSelectWeather,
  onSelectEarthquake,
  onSelectWarning,
  focusCommand,
}: {
  weather?: WeatherResponse;
  earthquakes: FilteredEarthquake[];
  selectedEarthquake?: FilteredEarthquake | null;
  warning?: WarningResponse;
  warningFocus?: number;
  onSelectWeather: () => void;
  onSelectEarthquake: (item: FilteredEarthquake) => void;
  onSelectWarning: (item: WeatherWarning) => void;
  focusCommand?: { type: "selected" | "warnings"; id: number } | null;
}) {
  const [basemap, setBasemap] = useState<BasemapKey>("osm");
  const [legend, setLegend] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [command, setCommand] = useState<MapCommand>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  useEffect(() => {
    const saved = localStorage.getItem("bmkg-sumut:basemap");
    if (saved && saved in basemaps)
      queueMicrotask(() => setBasemap(saved as BasemapKey));
  }, []);
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await rootRef.current?.requestFullscreen();
  };
  const chooseBasemap = (value: BasemapKey) => {
    setBasemap(value);
    localStorage.setItem("bmkg-sumut:basemap", value);
  };
  const location = weather?.location;
  return (
    <div
      ref={rootRef}
      id="peta"
      role="region"
      aria-label="Peta interaktif cuaca, gempa, dan peringatan dini"
      className={`relative h-[420px] scroll-mt-20 overflow-hidden bg-slate-200 md:h-[520px] ${
        fullscreen ? "h-screen rounded-none md:h-screen" : "rounded-xl"
      }`}
    >
      <MapContainer
        center={SUMUT_CENTER}
        zoom={7}
        minZoom={3}
        maxZoom={20}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          key={basemap}
          attribution={basemaps[basemap].attribution}
          url={basemaps[basemap].url}
        />
        <ScaleControl imperial={false} />
        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Lokasi Cuaca">
            <LayerGroup>
              {location?.latitude != null && location.longitude != null && (
                <Marker
                  position={[location.latitude, location.longitude]}
                  icon={weatherIcon}
                  eventHandlers={{ click: onSelectWeather }}
                >
                  <Popup>
                    <strong>{location.village}</strong>
                    <br />
                    {weather?.current?.weatherDescription ??
                      "Prakiraan belum tersedia"}
                  </Popup>
                </Marker>
              )}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay
            checked
            name={`Gempa hasil filter (${earthquakes.length})`}
          >
            <LayerGroup>
              <EarthquakeMarkers
                items={earthquakes}
                selectedId={selectedEarthquake?.id}
                onSelect={onSelectEarthquake}
              />
            </LayerGroup>
          </LayersControl.Overlay>
          {warning?.status === "active" && (
            <LayersControl.Overlay checked name="Peringatan Dini">
              <LayerGroup>
                {warning.warnings.flatMap((item, wi) =>
                  item.areas.flatMap((area, ai) =>
                    area.polygons.map((polygon, pi) => (
                      <Polygon
                        key={`${wi}-${ai}-${pi}`}
                        positions={polygon}
                        pathOptions={{
                          color: "#c2410c",
                          fillColor: "#f97316",
                          fillOpacity: 0.25,
                          weight: 3,
                        }}
                        eventHandlers={{ click: () => onSelectWarning(item) }}
                      >
                        <Popup>
                          <strong>
                            {item.headline ?? "Peringatan dini cuaca"}
                          </strong>
                          <br />
                          {area.description ?? "Wilayah tidak tersedia"}
                        </Popup>
                      </Polygon>
                    )),
                  ),
                )}
              </LayerGroup>
            </LayersControl.Overlay>
          )}
        </LayersControl>
        <MapFocus
          weather={weather}
          earthquakes={earthquakes}
          selected={selectedEarthquake}
          warning={warning}
          warningFocus={warningFocus}
          command={focusCommand ?? command}
        />
      </MapContainer>
      <div className="absolute bottom-7 left-3 z-[500] flex flex-col gap-2">
        {[
          [RotateCcw, "Reset ke Sumatera Utara", "reset"],
          [Crosshair, "Fokus wilayah aktif", "weather"],
          [LocateFixed, "Fokus semua gempa", "earthquakes"],
        ].map(([Icon, label, type]) => (
          <button
            key={label as string}
            title={label as string}
            aria-label={label as string}
            disabled={type === "earthquakes" && !earthquakes.length}
            onClick={() =>
              setCommand({
                type: type as "reset" | "weather" | "earthquakes",
                id: ++counter.current,
              })
            }
            className="grid size-10 place-items-center rounded-lg bg-white shadow disabled:opacity-40"
          >
            <Icon className="size-5" />
          </button>
        ))}
        <button
          title={fullscreen ? "Keluar fullscreen" : "Fullscreen"}
          aria-label={
            fullscreen ? "Keluar dari peta fullscreen" : "Buka peta fullscreen"
          }
          onClick={() => void toggleFullscreen()}
          className="grid size-10 place-items-center rounded-lg bg-white shadow"
        >
          {fullscreen ? (
            <Minimize2 className="size-5" />
          ) : (
            <Expand className="size-5" />
          )}
        </button>
        <button
          title="Legenda"
          aria-label="Buka legenda peta"
          onClick={() => setLegend((value) => !value)}
          className="grid size-10 place-items-center rounded-lg bg-white shadow"
        >
          <Layers3 className="size-5" />
        </button>
      </div>
      <label className="absolute top-3 left-14 z-[500] rounded-lg bg-white px-3 py-2 text-xs font-bold shadow">
        Basemap
        <select
          value={basemap}
          onChange={(event) => chooseBasemap(event.target.value as BasemapKey)}
          className="ml-2 bg-white font-medium"
        >
          {Object.entries(basemaps).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>
      {!earthquakes.length && (
        <p className="absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow">
          Tidak ada gempa sesuai filter.
        </p>
      )}
      {legend && (
        <aside className="absolute right-3 bottom-3 z-[500] max-h-[70%] w-64 overflow-y-auto rounded-xl bg-white/95 p-4 text-xs shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Legenda peta</h3>
            <button onClick={() => setLegend(false)} aria-label="Tutup legenda">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <p>
              <i className="mr-2 inline-block size-3 rounded-full bg-[#557a64]" />
              Wilayah cuaca aktif
            </p>
            <p>
              <i className="mr-2 inline-block size-3 rounded-full bg-yellow-500" />
              Gempa di bawah M4
            </p>
            <p>
              <i className="mr-2 inline-block size-3 rounded-full bg-orange-500" />
              Gempa M4–4,9
            </p>
            <p>
              <i className="mr-2 inline-block size-3 rounded-full bg-red-600" />
              Gempa M5+
            </p>
            <p>
              <i className="mr-2 inline-block size-3 rounded-full border-2 border-[#263b32]" />
              Gempa terpilih
            </p>
            <p>
              <i className="mr-2 inline-block size-3 rounded-full bg-[#365443]" />
              Cluster gempa
            </p>
            <p>
              <i className="mr-2 inline-block size-3 border-2 border-orange-700 bg-orange-300" />
              Polygon peringatan
            </p>
            <p>
              Basemap aktif: <strong>{basemaps[basemap].label}</strong>
            </p>
            <p className="border-t pt-2 text-slate-500">
              Sumber data BMKG. Attribution basemap tampil pada peta.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
