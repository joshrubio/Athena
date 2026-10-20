"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { altitudeProfile } from "@/lib/altitude";
import { estimateFlightSeconds, formatDuration, pathLengthMeters, type Drone } from "@/lib/mission";

const CRUISE_ALTITUDE_M = 80;
const SPEEDS = [1, 2, 4];

type Props = {
  drones: Drone[];
  playing: boolean;
  onPlayToggle: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  elapsedSeconds: number;
  totalSeconds: number;
  onScrub: (seconds: number) => void;
};

export default function SimulationBar({
  drones,
  playing,
  onPlayToggle,
  speed,
  onSpeedChange,
  elapsedSeconds,
  totalSeconds,
  onScrub,
}: Props) {
  const [tab, setTab] = useState<"altitude" | "stats">("altitude");
  const flyable = drones.filter((d) => d.path.length >= 2);
  const canSimulate = flyable.length > 0;

  return (
    <div className="absolute left-3 right-3 bottom-3 z-10 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-1">
          <TabButton active={tab === "altitude"} onClick={() => setTab("altitude")}>
            Altitude profile
          </TabButton>
          <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
            Mission stats
          </TabButton>
        </div>
        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={cn(
                "font-mono text-[10px] px-1.5 py-0.5 rounded",
                speed === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="h-16 px-3">
        {tab === "altitude" ? <AltitudeChart /> : <StatsTable drones={flyable} />}
      </div>

      <div className="flex items-center gap-3 px-3 pb-2.5">
        <button
          onClick={onPlayToggle}
          disabled={!canSimulate}
          className="size-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-primary/85 transition-colors shrink-0"
          aria-label={playing ? "Pause simulation" : "Play simulation"}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(1, totalSeconds)}
          step={0.1}
          value={Math.min(elapsedSeconds, totalSeconds)}
          onChange={(e) => onScrub(Number(e.target.value))}
          disabled={!canSimulate}
          className="flex-1 accent-primary"
        />
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
          {formatDuration(elapsedSeconds)} / {formatDuration(totalSeconds)}
        </span>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-md transition-colors",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function AltitudeChart() {
  const points = altitudeProfile(CRUISE_ALTITUDE_M);
  const max = CRUISE_ALTITUDE_M;
  const w = 100;
  const h = 100;
  const path = points
    .map((alt, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (alt / max) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <text x={1} y={8} className="fill-muted-foreground" style={{ fontSize: 7, fontFamily: "var(--font-space-mono)" }}>
        {CRUISE_ALTITUDE_M}m AGL
      </text>
    </svg>
  );
}

function StatsTable({ drones }: { drones: Drone[] }) {
  if (drones.length === 0) {
    return <p className="font-mono text-[11px] text-muted-foreground py-4">No flyable paths yet.</p>;
  }
  const totalDistanceKm = drones.reduce((sum, d) => sum + pathLengthMeters(d.path) / 1000, 0);
  const maxTime = Math.max(...drones.map(estimateFlightSeconds));

  return (
    <div className="flex items-center gap-6 h-full font-mono text-[11px]">
      <Stat label="UAVs" value={String(drones.length)} />
      <Stat label="Total distance" value={`${totalDistanceKm.toFixed(2)} km`} />
      <Stat label="Est. mission time" value={formatDuration(maxTime)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-primary">{value}</p>
    </div>
  );
}
