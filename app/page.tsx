"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MissionMap, { type MissionMapHandle } from "@/components/mission/MissionMap";
import ToolStrip from "@/components/mission/ToolStrip";
import KpiBar from "@/components/mission/KpiBar";
import MissionPanel from "@/components/mission/MissionPanel";
import SimulationBar from "@/components/mission/SimulationBar";
import { generateCoverageLanes, assignLanesToDrones, polygonAreaKm2 } from "@/lib/coverage";
import { sampleAlongPath } from "@/lib/simulate";
import {
  makeDrone,
  estimateFlightSeconds,
  formatDuration,
  type Drone,
  type LngLat,
} from "@/lib/mission";

const COVERAGE_LANE_SPACING_M = 40;

function initialDrones(count: number): Drone[] {
  return Array.from({ length: count }, (_, i) => makeDrone(i));
}

export default function MissionPage() {
  const [drones, setDrones] = useState<Drone[]>(() => initialDrones(2));
  const [droneCount, setDroneCount] = useState(2);
  const [activeDroneId, setActiveDroneId] = useState(drones[0].id);
  const [mode, setMode] = useState<"waypoint" | "coverage">("waypoint");
  const [coverageDraft, setCoverageDraft] = useState<LngLat[]>([]);
  const [coverageRing, setCoverageRing] = useState<LngLat[] | null>(null);
  const [groundTruthPoint, setGroundTruthPoint] = useState<LngLat | null>(null);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mapRef = useRef<MissionMapHandle>(null);
  const lastFrameRef = useRef<number | null>(null);

  const totalSeconds = Math.max(1, ...drones.map(estimateFlightSeconds));
  const waypointCount = drones.reduce((sum, d) => sum + d.path.length, 0);
  const coverageKm2 = coverageRing ? polygonAreaKm2(coverageRing) : 0;

  const handleDroneCountChange = useCallback((count: number) => {
    setDroneCount(count);
    setDrones((prev) => {
      const next = initialDrones(count);
      // Preserve existing paths for drones that still exist by index.
      return next.map((d, i) => (prev[i] ? { ...d, path: prev[i].path } : d));
    });
    setActiveDroneId((prev) => {
      const next = initialDrones(count);
      return next.some((d) => d.id === prev) ? prev : next[0].id;
    });
  }, []);

  const handleMapClick = useCallback(
    (lngLat: LngLat) => {
      setGroundTruthPoint(lngLat);
      if (mode === "waypoint") {
        setDrones((prev) =>
          prev.map((d) => (d.id === activeDroneId ? { ...d, path: [...d.path, lngLat] } : d))
        );
      } else {
        setCoverageDraft((prev) => [...prev, lngLat]);
      }
    },
    [mode, activeDroneId]
  );

  const handleGenerateCoverage = useCallback(() => {
    if (coverageDraft.length < 3) return;
    const ring = [...coverageDraft, coverageDraft[0]];
    const lanes = generateCoverageLanes(ring, COVERAGE_LANE_SPACING_M);
    const assigned = assignLanesToDrones(lanes, droneCount);
    setDrones((prev) => prev.map((d, i) => ({ ...d, path: assigned[i] ?? [] })));
    setCoverageRing(ring);
    setCoverageDraft([]);
    setPlaying(false);
    setElapsedSeconds(0);
  }, [coverageDraft, droneCount]);

  const handleClear = useCallback(() => {
    setDrones(initialDrones(droneCount));
    setCoverageDraft([]);
    setCoverageRing(null);
    setGroundTruthPoint(null);
    setPlaying(false);
    setElapsedSeconds(0);
  }, [droneCount]);

  const handleScrub = useCallback((seconds: number) => {
    setElapsedSeconds(seconds);
  }, []);

  // Simulation loop — advances elapsed time and pushes drone marker
  // positions imperatively (bypassing React state) every animation frame;
  // only the scrubber/telemetry readouts are backed by React state.
  useEffect(() => {
    if (!playing) {
      lastFrameRef.current = null;
      return;
    }
    let raf: number;
    const tick = (now: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const deltaSeconds = ((now - lastFrameRef.current) / 1000) * speed;
      lastFrameRef.current = now;

      let reachedEnd = false;
      setElapsedSeconds((prev) => {
        const next = prev + deltaSeconds;
        if (next >= totalSeconds) {
          reachedEnd = true;
          return totalSeconds;
        }
        return next;
      });

      if (reachedEnd) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, totalSeconds]);

  // Push marker positions whenever elapsedSeconds changes (driven by the
  // loop above, or by dragging the scrubber).
  useEffect(() => {
    for (const drone of drones) {
      if (drone.path.length < 2) continue;
      const distance = elapsedSeconds * drone.cruiseSpeedMs;
      const sample = sampleAlongPath(drone.path, distance);
      if (sample) mapRef.current?.setDronePosition(drone.id, sample.position, sample.bearingDeg);
    }
  }, [elapsedSeconds, drones]);

  const batteryPctById: Record<string, number> = {};
  for (const d of drones) {
    const droneTotal = estimateFlightSeconds(d);
    const pct = droneTotal > 0 ? Math.max(0, 100 * (1 - elapsedSeconds / droneTotal)) : 100;
    batteryPctById[d.id] = pct;
  }

  return (
    <div className="relative flex-1 min-h-0">
      <MissionMap
        ref={mapRef}
        drones={drones}
        activeDroneId={activeDroneId}
        mode={mode}
        coverageDraft={coverageDraft}
        coverageRing={coverageRing}
        onMapClick={handleMapClick}
      />
      <ToolStrip
        mode={mode}
        onModeChange={setMode}
        drones={drones}
        activeDroneId={activeDroneId}
        onActiveDroneChange={setActiveDroneId}
        droneCount={droneCount}
        onDroneCountChange={handleDroneCountChange}
        coverageDraftCount={coverageDraft.length}
        onGenerateCoverage={handleGenerateCoverage}
        onClear={handleClear}
        groundTruthPoint={groundTruthPoint}
      />
      <KpiBar
        droneCount={droneCount}
        waypointCount={waypointCount}
        coverageKm2={coverageKm2}
        maxMissionTimeLabel={formatDuration(totalSeconds)}
      />
      <MissionPanel drones={drones} batteryPctById={batteryPctById} />
      <SimulationBar
        drones={drones}
        playing={playing}
        onPlayToggle={() => setPlaying((v) => !v)}
        speed={speed}
        onSpeedChange={setSpeed}
        elapsedSeconds={elapsedSeconds}
        totalSeconds={totalSeconds}
        onScrub={handleScrub}
      />
    </div>
  );
}
