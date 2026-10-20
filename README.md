# Athena

Named for the Greek goddess of strategic warfare and tactics — planning, not brute combat. A
drone swarm mission planner: draw waypoints or a coverage area on a real map, generate a
boustrophedon ("lawnmower") coverage path across a fleet with real computational geometry, and
play back a client-side kinematic simulation of the swarm flying it. Built as a standalone
portfolio project.

This project is deliberately **not** trying to simulate real aircraft. There's no MAVLink or
flight-controller protocol, no physics engine, no airspace/battery-reserve validation — unlike
[QGroundControl](https://qgroundcontrol.com) or [DJI FlightHub 2](https://enterprise.dji.com/flighthub-2).
It's the UX/interpretation layer over a client-side simulation, held to the same honesty
discipline as the rest of this portfolio: see `/docs` in the app for the full "what this is /
isn't" writeup.

## What's real here

- **The map**: [MapLibre GL JS](https://maplibre.org) over a free CartoDB dark-matter vector
  basemap — real streets, real geography, no API key required.
- **The coverage algorithm**: [Turf.js](https://turfjs.org) computes real sweep-line/polygon
  intersections (`lineIntersect`, `polygonToLine`) to turn a drawn polygon into actual lane
  segments, round-robined across the fleet and chained into flyable paths — not a visual trick.
- **The ground-truth panel**: clicking the map queries [Mapillary](https://www.mapillary.com)'s
  Image Radius Search for the nearest real public street-level photo within 50m, clearly labeled
  as a real photo for geographic context — not the drone's own camera.

Everything else — drone positions, battery, altitude — is a simple, disclosed kinematic
simulation (`lib/simulate.ts`): constant cruise speed along straight segments, linear battery
drain, a flat altitude hold with a short takeoff/landing ramp.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui (`@base-ui/react`)
· MapLibre GL JS · Turf.js · Mapillary (Graph API v4).

## Identity

Benchmarked against real mission-planning UIs — QGroundControl's tool-strip/editor-panel/bottom-stats
grammar, DJI FlightHub 2's floating glass KPI tiles and compass/zoom cluster — rather than reskinned
from the other satellites: a near-black radar-scope backdrop, a phosphor-green accent reserved for
functional signals, Space Grotesk for UI chrome paired with Space Mono for telemetry/coordinates,
and small "glass panel" radius with backdrop blur.

## Running it locally

```bash
npm install
npm run dev
```

Requires a free `MAPILLARY_CLIENT_TOKEN` in `.env.local` (register at
[mapillary.com/dashboard/developers](https://www.mapillary.com/dashboard/developers)) for the
ground-truth panel; everything else works without any API key.

### A maplibre-gl + Turbopack note

`maplibre-gl`'s default `new Worker(new URL(...))` path doesn't resolve under Turbopack, in dev or
in a production build. `dist/maplibre-gl-worker.mjs` is copied into `public/` and pointed at
explicitly via `maplibregl.setWorkerUrl()` before the first `Map` is constructed (see
`components/mission/MissionMap.tsx`). Re-run that copy step if `maplibre-gl` is upgraded.
