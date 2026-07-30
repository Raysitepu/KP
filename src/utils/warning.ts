export function parseCapPolygon(value: unknown): [number, number][] {
  if (typeof value !== "string") return [];
  const points = value
    .trim()
    .split(/\s+/)
    .flatMap((pair) => {
      const values = pair.split(",");
      if (values.length !== 2) return [];
      const latitude = Number(values[0]);
      const longitude = Number(values[1]);
      return Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
        ? [[latitude, longitude] as [number, number]]
        : [];
    });
  return points.length >= 3 ? points : [];
}

export function isAllowedCapUrl(value: string) {
  try {
    const url = new URL(value, "https://www.bmkg.go.id");
    return (
      url.protocol === "https:" &&
      url.hostname === "www.bmkg.go.id" &&
      url.pathname.startsWith("/alerts/nowcast/id/") &&
      url.pathname.endsWith("_alert.xml") &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
