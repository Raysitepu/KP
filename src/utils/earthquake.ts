export function parseCoordinates(
  value: unknown,
): [number | null, number | null] {
  if (typeof value !== "string") return [null, null];
  const [lat, lon] = value.split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon)
    ? [lat, lon]
    : [null, null];
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isAllowedBmkgShakemapUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "data.bmkg.go.id" ||
        url.hostname.endsWith(".bmkg.go.id"))
    );
  } catch {
    return false;
  }
}
