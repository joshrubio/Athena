import type { LngLat } from "./mission";

type Sample = { position: LngLat; bearingDeg: number };

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function haversineMeters([lon1, lat1]: LngLat, [lon2, lat2]: LngLat): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bearingDeg([lon1, lat1]: LngLat, [lon2, lat2]: LngLat): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function lerp(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Walks a path's cumulative segment distances to find the point at
 * `distanceMeters` along it, linearly interpolating within the enclosing
 * segment and returning the heading of that segment. Clamps to the path's
 * start/end rather than extrapolating.
 */
export function sampleAlongPath(path: LngLat[], distanceMeters: number): Sample | null {
  if (path.length < 2) return null;
  if (distanceMeters <= 0) {
    return { position: path[0], bearingDeg: bearingDeg(path[0], path[1]) };
  }

  let covered = 0;
  for (let i = 1; i < path.length; i++) {
    const segLen = haversineMeters(path[i - 1], path[i]);
    if (covered + segLen >= distanceMeters) {
      const t = segLen === 0 ? 0 : (distanceMeters - covered) / segLen;
      return { position: lerp(path[i - 1], path[i], t), bearingDeg: bearingDeg(path[i - 1], path[i]) };
    }
    covered += segLen;
  }

  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  return { position: last, bearingDeg: bearingDeg(prev, last) };
}
