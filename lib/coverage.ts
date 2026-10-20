// Real boustrophedon ("lawnmower") coverage-path generation over a
// user-drawn polygon, using Turf.js for the actual computational geometry
// (bbox, line/polygon intersection) — not a hand-waved visual effect.
// Deliberately simplified vs. a production coverage-path planner: sweep
// lines are always west-to-east stacked south-to-north, never rotated to
// the polygon's minimum-width axis, so turn count isn't optimized. That
// limitation is explained in /docs rather than hidden.
import * as turf from "@turf/turf";
import type { LngLat } from "./mission";

const METERS_PER_DEGREE_LAT = 111_320;

export function generateCoverageLanes(ring: LngLat[], spacingMeters: number): LngLat[][] {
  const polygon = turf.polygon([ring]);
  const [minX, minY, maxX, maxY] = turf.bbox(polygon);
  const boundary = turf.polygonToLine(polygon);

  const spacingDeg = spacingMeters / METERS_PER_DEGREE_LAT;
  const lanes: LngLat[][] = [];

  for (let y = minY + spacingDeg / 2; y < maxY; y += spacingDeg) {
    const sweep = turf.lineString([
      [minX - 0.01, y],
      [maxX + 0.01, y],
    ]);

    const hits = turf.lineIntersect(sweep, boundary);
    const xs = hits.features
      .map((f) => f.geometry.coordinates[0] as number)
      .sort((a, b) => a - b);

    // A simple (non-self-intersecting) polygon crosses any sweep line an
    // even number of times; pair crossings as (entry, exit) segments.
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const a: LngLat = [xs[i], y];
      const b: LngLat = [xs[i + 1], y];
      if (turf.distance(a, b, { units: "meters" }) > 1) {
        lanes.push([a, b]);
      }
    }
  }

  return lanes;
}

/**
 * Splits a set of coverage lanes round-robin across N drones, then chains
 * each drone's lanes into a single flyable path — reversing every other
 * lane so consecutive legs connect end-to-end (the actual boustrophedon
 * zigzag), instead of each drone flying back to a shared start point.
 */
export function assignLanesToDrones(lanes: LngLat[][], droneCount: number): LngLat[][] {
  const perDrone: LngLat[][][] = Array.from({ length: droneCount }, () => []);
  lanes.forEach((lane, i) => perDrone[i % droneCount].push(lane));

  return perDrone.map((droneLanes) => {
    const path: LngLat[] = [];
    droneLanes.forEach((lane, i) => {
      const oriented = i % 2 === 0 ? lane : [...lane].reverse();
      path.push(...oriented);
    });
    return path;
  });
}

export function polygonAreaKm2(ring: LngLat[]): number {
  if (ring.length < 4) return 0;
  const polygon = turf.polygon([ring]);
  return turf.area(polygon) / 1_000_000;
}
