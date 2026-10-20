"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { MAP_STYLE_URL } from "@/lib/map-style";
import type { Drone, LngLat } from "@/lib/mission";

// Turbopack can't resolve maplibre-gl's worker via its default
// new Worker(new URL(...)) path, so dist/maplibre-gl-worker.mjs is copied
// into public/ (a one-time step, re-run if maplibre-gl is upgraded) and
// pointed at explicitly, before any Map is constructed.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export type MissionMapHandle = {
  setDronePosition(droneId: string, lngLat: LngLat, bearingDeg: number): void;
};

const DEFAULT_CENTER: LngLat = [-3.7038, 40.4168]; // Madrid — arbitrary, real-world default

type Props = {
  drones: Drone[];
  activeDroneId: string;
  mode: "waypoint" | "coverage";
  coverageDraft: LngLat[];
  coverageRing: LngLat[] | null;
  onMapClick: (lngLat: LngLat) => void;
};

const EMPTY_FC = { type: "FeatureCollection" as const, features: [] };

function dronePathsFC(drones: Drone[]) {
  return {
    type: "FeatureCollection" as const,
    features: drones
      .filter((d) => d.path.length >= 2)
      .map((d) => ({
        type: "Feature" as const,
        properties: { color: d.color, droneId: d.id },
        geometry: { type: "LineString" as const, coordinates: d.path },
      })),
  };
}

function waypointsFC(drones: Drone[]) {
  return {
    type: "FeatureCollection" as const,
    features: drones.flatMap((d) =>
      d.path.map((p, i) => ({
        type: "Feature" as const,
        properties: { color: d.color, droneId: d.id, index: i },
        geometry: { type: "Point" as const, coordinates: p },
      }))
    ),
  };
}

function coverageDraftFC(points: LngLat[]) {
  if (points.length < 2) {
    return { type: "FeatureCollection" as const, features: [] };
  }
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: points },
      },
    ],
  };
}

function coverageRingFC(ring: LngLat[] | null) {
  if (!ring || ring.length < 4) {
    return { type: "FeatureCollection" as const, features: [] };
  }
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Polygon" as const, coordinates: [ring] },
      },
    ],
  };
}

const MissionMap = forwardRef<MissionMapHandle, Props>(function MissionMap(
  { drones, coverageDraft, coverageRing, onMapClick },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useImperativeHandle(ref, () => ({
    setDronePosition(droneId, lngLat, bearingDeg) {
      const marker = markersRef.current.get(droneId);
      if (marker) {
        marker.setLngLat(lngLat);
        marker.setRotation(bearingDeg);
      }
    },
  }));

  // Map init — runs once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    mapRef.current = map;

    map.on("click", (e: maplibregl.MapMouseEvent) => {
      onMapClickRef.current([e.lngLat.lng, e.lngLat.lat]);
    });

    map.on("load", () => {
      map.addSource("drone-paths", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "drone-paths-line",
        type: "line",
        source: "drone-paths",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.85,
        },
      });

      map.addSource("waypoints", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "waypoints-circle",
        type: "circle",
        source: "waypoints",
        paint: {
          "circle-radius": 4,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#000",
        },
      });

      map.addSource("coverage-draft", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "coverage-draft-line",
        type: "line",
        source: "coverage-draft",
        paint: {
          "line-color": "#3be87a",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
        },
      });

      map.addSource("coverage-ring", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "coverage-ring-fill",
        type: "fill",
        source: "coverage-ring",
        paint: { "fill-color": "#3be87a", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "coverage-ring-line",
        type: "line",
        source: "coverage-ring",
        paint: { "line-color": "#3be87a", "line-width": 1.5 },
      });
    });

    const markers = markersRef.current;
    return () => {
      // Markers are children of this map's container, which is about to be
      // torn down — drop the refs too, or a StrictMode remount (or any
      // future remount) sees stale entries in markersRef and skips
      // recreating them for the new map instance.
      for (const marker of markers.values()) marker.remove();
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Keep drone markers in sync with the drone list (create/remove only).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existingIds = new Set(markersRef.current.keys());
    for (const drone of drones) {
      existingIds.delete(drone.id);
      if (!markersRef.current.has(drone.id)) {
        const el = document.createElement("div");
        el.style.width = "0";
        el.style.height = "0";
        el.style.borderLeft = "6px solid transparent";
        el.style.borderRight = "6px solid transparent";
        el.style.borderBottom = `12px solid ${drone.color}`;
        el.style.filter = `drop-shadow(0 0 4px ${drone.color})`;

        const marker = new maplibregl.Marker({ element: el, rotationAlignment: "map" });
        marker.setLngLat(drone.path[0] ?? DEFAULT_CENTER);
        marker.addTo(map);
        markersRef.current.set(drone.id, marker);
      }
    }
    for (const staleId of existingIds) {
      markersRef.current.get(staleId)?.remove();
      markersRef.current.delete(staleId);
    }
  }, [drones]);

  // Push data updates whenever drones/coverage change (not per animation frame).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("drone-paths") as maplibregl.GeoJSONSource | undefined)?.setData(
      dronePathsFC(drones)
    );
    (map.getSource("waypoints") as maplibregl.GeoJSONSource | undefined)?.setData(
      waypointsFC(drones)
    );
  }, [drones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("coverage-draft") as maplibregl.GeoJSONSource | undefined)?.setData(
      coverageDraftFC(coverageDraft)
    );
  }, [coverageDraft]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("coverage-ring") as maplibregl.GeoJSONSource | undefined)?.setData(
      coverageRingFC(coverageRing)
    );
  }, [coverageRing]);

  // maplibre-gl's own stylesheet sets `.maplibregl-map { position: relative }`
  // on this element (it adds that class itself), which overrides a Tailwind
  // `absolute` utility here — h-full/w-full fills the already-positioned
  // parent instead of fighting that.
  return <div ref={containerRef} className="h-full w-full" />;
});

export default MissionMap;
