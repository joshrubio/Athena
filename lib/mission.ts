export type LngLat = [number, number];

export type DroneStatus = "ok" | "warning" | "critical" | "offline";

export type Drone = {
  id: string;
  label: string;
  color: string;
  /** Waypoints this drone will fly, in order. Includes any lanes assigned by coverage generation. */
  path: LngLat[];
  cruiseSpeedMs: number;
  batteryCapacityPct: number;
};

export type CoverageArea = {
  /** Closed ring, first point repeated last, as GeoJSON expects. */
  ring: LngLat[];
};

// Hex, not oklch: these feed maplibre-gl's own paint-property color parser
// (data-driven ["get", "color"] expressions), which doesn't understand
// oklch() the way a browser's CSS engine does.
export const DRONE_COLORS = [
  "#3be87a", // phosphor green (drone 1)
  "#38bdf8", // cyan-blue
  "#fbbf24", // amber
  "#e84fd9", // magenta
  "#facc15", // yellow
  "#a78bfa", // violet
];

export function makeDrone(index: number): Drone {
  return {
    id: `drone-${index + 1}`,
    label: `UAV-${String(index + 1).padStart(2, "0")}`,
    color: DRONE_COLORS[index % DRONE_COLORS.length],
    path: [],
    cruiseSpeedMs: 12, // ~43 km/h, a plausible small-UAV cruise speed
    batteryCapacityPct: 100,
  };
}

/** Great-circle-ish path length in meters, summing consecutive segment distances (haversine). */
export function pathLengthMeters(path: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineMeters(path[i - 1], path[i]);
  }
  return total;
}

function haversineMeters([lon1, lat1]: LngLat, [lon2, lat2]: LngLat): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function estimateFlightSeconds(drone: Drone): number {
  return pathLengthMeters(drone.path) / drone.cruiseSpeedMs;
}

export function formatDuration(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
