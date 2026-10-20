"use client";

import { useEffect, useState } from "react";
import type { LngLat } from "@/lib/mission";

type MapillaryImage = {
  id: string;
  thumb_1024_url: string;
  captured_at: number;
  compass_angle: number;
};

type State =
  | { status: "loading" }
  | { status: "found"; image: MapillaryImage }
  | { status: "empty" }
  | { status: "error" };

export default function GroundTruthPanel({ point }: { point: LngLat | null }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!point) return; // nothing to fetch; the idle message is rendered directly from `point` below
    let cancelled = false;
    // Resetting to "loading" before a fetch tied to this same effect's
    // dependency change is the standard data-fetching pattern, not the
    // derived-state anti-pattern this rule otherwise guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    const [lng, lat] = point;
    fetch(`/api/ground-truth?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setState(data.image ? { status: "found", image: data.image } : { status: "empty" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [point]);

  if (!point) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Click the map to look for the nearest real public photo (within 50m, via Mapillary).
      </p>
    );
  }

  if (state.status === "loading") {
    return <div className="h-20 rounded-md bg-muted animate-pulse" />;
  }

  if (state.status === "empty") {
    return <p className="text-[11px] text-muted-foreground">No public street-level imagery within 50m here.</p>;
  }

  if (state.status === "error") {
    return <p className="text-[11px] text-destructive">Couldn&apos;t reach Mapillary.</p>;
  }

  const { image } = state;
  return (
    <div>
      <a href={`https://www.mapillary.com/app/?focus=photo&pKey=${image.id}`} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.thumb_1024_url}
          alt="Nearest real public street-level photo"
          className="w-full rounded-md border border-border/60 object-cover aspect-video"
        />
      </a>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Real public photo, not drone footage —{" "}
        <a href="https://www.mapillary.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
          Mapillary
        </a>
        , {new Date(image.captured_at).getFullYear()}
      </p>
    </div>
  );
}
