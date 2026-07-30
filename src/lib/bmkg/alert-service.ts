import "server-only";

import { getWeatherWarning } from "@/services/bmkg-warning.service";
import type { RegionRecord } from "@/types/regions";
import type { WarningResponse, WeatherWarning } from "@/types/warning";
import { normalizeRegionKey } from "@/lib/regions/normalizer";
import { TtlCache, ALERT_CACHE_MS } from "./cache";

const memory = new TtlCache<WarningResponse>();

export async function getCachedAlerts() {
  const cached = memory.get("sumatera-utara");
  if (cached) return cached;
  const alerts = await getWeatherWarning();
  memory.set("sumatera-utara", alerts, ALERT_CACHE_MS);
  return alerts;
}

function pointInsidePolygon(
  latitude: number,
  longitude: number,
  polygon: [number, number][],
) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersects =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function warningMatchesRegion(
  warning: WeatherWarning,
  region: RegionRecord,
) {
  const names = [
    region.villageName,
    region.districtName,
    region.regencyName,
  ].map(normalizeRegionKey);
  return warning.areas.some((area) => {
    const description = normalizeRegionKey(area.description ?? "");
    if (names.some((name) => name.length >= 4 && description.includes(name)))
      return true;
    if (region.latitude == null || region.longitude == null) return false;
    return area.polygons.some((polygon) =>
      pointInsidePolygon(region.latitude!, region.longitude!, polygon),
    );
  });
}

export function filterAlertsForRegion(
  response: WarningResponse,
  region: RegionRecord,
) {
  if (response.status !== "active") return [];
  return response.warnings.filter((warning) =>
    warningMatchesRegion(warning, region),
  );
}
