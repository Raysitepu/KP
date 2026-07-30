import type { RouteGeometry, SampledRoutePoint } from "@/types/route";
import {
  durationAtDistance,
  estimatedArrivalTime,
} from "./route-time-calculator";

const EARTH_RADIUS_KM = 6_371.0088;
const MAX_WEATHER_POINTS = 15;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(
  left: [number, number],
  right: [number, number],
) {
  const [leftLng, leftLat] = left;
  const [rightLng, rightLat] = right;
  const latitudeDelta = radians(rightLat - leftLat);
  const longitudeDelta = radians(rightLng - leftLng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(leftLat)) *
      Math.cos(radians(rightLat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function routeLengthKm(geometry: RouteGeometry) {
  return geometry.coordinates.slice(1).reduce((total, coordinate, index) => {
    return total + haversineDistanceKm(geometry.coordinates[index], coordinate);
  }, 0);
}

function samplingIntervalKm(totalKm: number) {
  const preferred = totalKm < 20 ? 5 : totalKm <= 100 ? 10 : 25;
  return Math.max(preferred, totalKm / (MAX_WEATHER_POINTS - 1));
}

function cumulativeDistances(geometry: RouteGeometry) {
  const result = [0];
  for (let index = 1; index < geometry.coordinates.length; index += 1) {
    result.push(
      result[index - 1] +
        haversineDistanceKm(
          geometry.coordinates[index - 1],
          geometry.coordinates[index],
        ),
    );
  }
  return result;
}

function coordinateAtDistance(
  geometry: RouteGeometry,
  cumulative: number[],
  targetKm: number,
) {
  const lastIndex = cumulative.length - 1;
  if (targetKm <= 0) return geometry.coordinates[0];
  if (targetKm >= cumulative[lastIndex]) return geometry.coordinates[lastIndex];
  let index = 1;
  while (index < cumulative.length && cumulative[index] < targetKm) index += 1;
  const before = cumulative[index - 1];
  const segment = cumulative[index] - before;
  const ratio = segment <= 0 ? 0 : (targetKm - before) / segment;
  const [startLng, startLat] = geometry.coordinates[index - 1];
  const [endLng, endLat] = geometry.coordinates[index];
  return [
    startLng + (endLng - startLng) * ratio,
    startLat + (endLat - startLat) * ratio,
  ] as [number, number];
}

export function sampleRoutePoints(
  geometry: RouteGeometry,
  totalDistanceMeters: number,
  totalDurationSeconds: number,
  departureTime: string,
): SampledRoutePoint[] {
  const cumulative = cumulativeDistances(geometry);
  const geometryLengthKm = cumulative.at(-1) ?? 0;
  if (geometryLengthKm <= 0) return [];
  const routeDistanceKm = Math.max(
    geometryLengthKm,
    totalDistanceMeters / 1_000,
  );
  const interval = samplingIntervalKm(routeDistanceKm);
  const targets = [0];
  for (
    let distance = interval;
    distance < geometryLengthKm;
    distance += interval
  )
    targets.push(distance);
  if (geometryLengthKm >= 10 && targets.length === 1)
    targets.push(geometryLengthKm / 2);
  targets.push(geometryLengthKm);

  return targets.slice(0, MAX_WEATHER_POINTS).map((distanceKm, index) => {
    const [longitude, latitude] = coordinateAtDistance(
      geometry,
      cumulative,
      distanceKm,
    );
    const distanceMeters = Math.min(
      totalDistanceMeters,
      (distanceKm / geometryLengthKm) * totalDistanceMeters,
    );
    const durationSeconds = durationAtDistance(
      distanceMeters,
      totalDistanceMeters,
      totalDurationSeconds,
    );
    return {
      id: `route-point-${index + 1}`,
      index,
      latitude,
      longitude,
      distanceFromOriginKm: Math.round((distanceMeters / 1_000) * 10) / 10,
      durationFromOriginMinutes: Math.round(durationSeconds / 60),
      estimatedArrivalTime: estimatedArrivalTime(
        departureTime,
        durationSeconds,
      ),
    };
  });
}
