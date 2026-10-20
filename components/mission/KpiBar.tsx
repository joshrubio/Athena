"use client";

type Props = {
  droneCount: number;
  waypointCount: number;
  coverageKm2: number;
  maxMissionTimeLabel: string;
};

export default function KpiBar({ droneCount, waypointCount, coverageKm2, maxMissionTimeLabel }: Props) {
  const items = [
    { label: "UAVs", value: String(droneCount) },
    { label: "Waypoints", value: String(waypointCount) },
    { label: "Coverage", value: `${coverageKm2.toFixed(2)} km²` },
    { label: "Est. time", value: maxMissionTimeLabel },
  ];

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-3 z-10 flex items-stretch gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border/60 bg-card/70 backdrop-blur-sm px-3.5 py-1.5 shadow-lg"
        >
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
          <p className="font-mono text-sm text-primary tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
