export function estimatedArrivalTime(
  departureTime: string | Date,
  durationFromOriginSeconds: number,
) {
  const departure = new Date(departureTime);
  if (Number.isNaN(departure.getTime()))
    throw new Error("Waktu keberangkatan tidak valid.");
  return new Date(
    departure.getTime() + durationFromOriginSeconds * 1_000,
  ).toISOString();
}

export function durationAtDistance(
  distanceFromOriginMeters: number,
  totalDistanceMeters: number,
  totalDurationSeconds: number,
) {
  if (totalDistanceMeters <= 0 || totalDurationSeconds <= 0) return 0;
  const ratio = Math.min(
    1,
    Math.max(0, distanceFromOriginMeters / totalDistanceMeters),
  );
  return ratio * totalDurationSeconds;
}
