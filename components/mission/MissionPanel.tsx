"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { estimateFlightSeconds, formatDuration, pathLengthMeters, type Drone } from "@/lib/mission";

type Props = {
  drones: Drone[];
  batteryPctById: Record<string, number>;
};

export default function MissionPanel({ drones, batteryPctById }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute right-3 top-3 bottom-3 z-10 flex flex-col items-end gap-2">
      <Button
        variant="secondary"
        size="icon"
        className="bg-card/70 backdrop-blur-sm border border-border/60 shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Collapse mission panel" : "Expand mission panel"}
      >
        {open ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
      </Button>

      {open && (
        <div className="w-56 flex-1 min-h-0 overflow-y-auto rounded-lg border border-border/60 bg-card/70 backdrop-blur-sm shadow-lg">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1.5">
            Fleet
          </p>
          <div className="flex flex-col divide-y divide-border/60">
            {drones.map((d) => {
              const distanceKm = pathLengthMeters(d.path) / 1000;
              const seconds = estimateFlightSeconds(d);
              const battery = batteryPctById[d.id] ?? 100;
              return (
                <div key={d.id} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: d.color }} />
                    <span className="font-mono text-xs">{d.label}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 font-mono text-[10px] text-muted-foreground">
                    <span>{d.path.length} wpts</span>
                    <span>{distanceKm.toFixed(2)} km</span>
                    <span>{formatDuration(seconds)}</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${battery}%`,
                        background: battery < 20 ? "var(--status-critical)" : "var(--status-ok)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
