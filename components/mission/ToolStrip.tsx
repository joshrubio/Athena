"use client";

import { MapPin, Hexagon, Minus, Plus, Trash2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Drone, LngLat } from "@/lib/mission";
import GroundTruthPanel from "./GroundTruthPanel";

type Mode = "waypoint" | "coverage";

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  drones: Drone[];
  activeDroneId: string;
  onActiveDroneChange: (id: string) => void;
  droneCount: number;
  onDroneCountChange: (count: number) => void;
  coverageDraftCount: number;
  onGenerateCoverage: () => void;
  onClear: () => void;
  groundTruthPoint: LngLat | null;
};

export default function ToolStrip({
  mode,
  onModeChange,
  drones,
  activeDroneId,
  onActiveDroneChange,
  droneCount,
  onDroneCountChange,
  coverageDraftCount,
  onGenerateCoverage,
  onClear,
  groundTruthPoint,
}: Props) {
  return (
    <div className="absolute left-3 top-3 bottom-3 z-10 flex flex-col gap-2 w-44 overflow-y-auto">
      <Panel>
        <SectionLabel>Mode</SectionLabel>
        <div className="flex flex-col gap-1">
          <ToolButton
            icon={<MapPin className="size-3.5" />}
            label="Waypoint"
            active={mode === "waypoint"}
            onClick={() => onModeChange("waypoint")}
          />
          <ToolButton
            icon={<Hexagon className="size-3.5" />}
            label="Coverage area"
            active={mode === "coverage"}
            onClick={() => onModeChange("coverage")}
          />
        </div>
      </Panel>

      {mode === "waypoint" && (
        <Panel>
          <SectionLabel>Active UAV</SectionLabel>
          <div className="flex flex-col gap-1">
            {drones.map((d) => (
              <button
                key={d.id}
                onClick={() => onActiveDroneChange(d.id)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md font-mono text-[11px] transition-colors",
                  activeDroneId === d.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <span className="size-2 rounded-full" style={{ background: d.color }} />
                {d.label}
              </button>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <SectionLabel>Fleet size</SectionLabel>
        <div className="flex items-center justify-between">
          <button
            onClick={() => onDroneCountChange(Math.max(1, droneCount - 1))}
            className="size-6 flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors"
            aria-label="Fewer drones"
          >
            <Minus className="size-3" />
          </button>
          <span className="font-mono text-sm tabular-nums">{droneCount}</span>
          <button
            onClick={() => onDroneCountChange(Math.min(6, droneCount + 1))}
            className="size-6 flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors"
            aria-label="More drones"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </Panel>

      {mode === "coverage" && (
        <Panel>
          <SectionLabel>Coverage area</SectionLabel>
          <p className="text-[11px] text-muted-foreground mb-2">
            Click the map to draw a polygon ({coverageDraftCount} point{coverageDraftCount === 1 ? "" : "s"}).
          </p>
          <button
            onClick={onGenerateCoverage}
            disabled={coverageDraftCount < 3}
            className="w-full h-7 flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-wide disabled:opacity-40 disabled:pointer-events-none hover:bg-primary/85 transition-colors"
          >
            <Play className="size-3" />
            Generate
          </button>
        </Panel>
      )}

      <Panel>
        <SectionLabel>Ground truth</SectionLabel>
        <GroundTruthPanel point={groundTruthPoint} />
      </Panel>

      <div className="flex-1" />

      <Panel>
        <button
          onClick={onClear}
          className="w-full h-7 flex items-center justify-center gap-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-mono text-[11px] uppercase tracking-wide transition-colors"
        >
          <Trash2 className="size-3" />
          Clear mission
        </button>
      </Panel>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/70 backdrop-blur-sm px-2.5 py-2.5 shadow-lg">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">{children}</p>
  );
}

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md font-mono text-[11px] transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
