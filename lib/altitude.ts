// A simple, honest altitude profile: ramps from 0 to the cruise altitude
// over the first 5% of the path, holds level, then ramps back down over
// the last 5% — not terrain-following or real flight dynamics, just the
// constant-AGL hold pattern a real survey/coverage mission would fly.
export function altitudeProfile(cruiseAltitudeM: number, samples = 40): number[] {
  const points: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    let alt = cruiseAltitudeM;
    if (t < 0.05) alt = cruiseAltitudeM * (t / 0.05);
    else if (t > 0.95) alt = cruiseAltitudeM * ((1 - t) / 0.05);
    points.push(Math.max(0, alt));
  }
  return points;
}
