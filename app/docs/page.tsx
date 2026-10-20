const SECTIONS = [
  {
    title: "What this is",
    body: [
      "Athena is a client-side drone swarm mission planner: draw waypoints or a coverage area on a real map, generate a lawnmower coverage path across a fleet with Turf.js (real computational geometry, not a visual trick), and play back a kinematic simulation of the fleet flying it.",
      "The map itself is real (MapLibre GL JS over a public vector basemap) and the nearest-real-photo panel pulls genuine public street-level imagery from Mapillary. Everything else — the drones, their telemetry, the flight — is a simulation.",
    ],
  },
  {
    title: "What it isn't",
    body: [
      "There are no real aircraft here, no MAVLink or flight-controller protocol, and no physics engine: drones move at a constant assumed cruise speed along straight segments, battery drains linearly against total estimated flight time, and altitude is a flat hold with a short ramp at takeoff/landing — not wind, not terrain-following, not a dynamics model.",
      "The coverage-path algorithm is a real boustrophedon (\"lawnmower\") sweep — lane spacing and polygon intersection are computed properly — but the sweep orientation is fixed west-to-east rather than rotated to the polygon's minimum-width axis, so turn count isn't optimized the way a production coverage-path planner would. A real mission planner (QGroundControl, DJI FlightHub, Auterion Mission Control) also validates airspace, battery reserves, and RF link budgets; none of that exists here.",
    ],
  },
  {
    title: "The ground truth panel",
    body: [
      "Clicking the map queries Mapillary's Image Radius Search for the nearest real public photo within 50 meters (a limit Mapillary's API itself imposes). It's labeled plainly because it's easy to misread as the drone's own camera — it isn't. It's a real photo from a real public contributor, shown for geographic context, with no connection to the simulated flight.",
      "Most places on Earth have no Mapillary coverage within 50m, so an honest \"no public imagery here\" result is the common case, not a bug.",
    ],
  },
  {
    title: "Pipeline",
    body: [
      "lib/coverage.ts builds sweep lines across a drawn polygon's bounding box and intersects them with the polygon boundary (Turf.js lineIntersect/polygonToLine) to get real lane segments, then round-robins lanes across the fleet and chains each drone's lanes into one flyable path.",
      "lib/simulate.ts walks a path's cumulative segment distances to sample position and heading at any elapsed time — that's the whole \"flight model.\" app/api/ground-truth proxies Mapillary server-side so the API token never reaches the browser.",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="flex-1 max-w-2xl w-full mx-auto px-5 py-8 flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">&gt; athena docs</p>
        <h1 className="text-lg mt-1">Docs</h1>
      </div>
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="text-sm text-primary font-mono">{section.title}</h2>
          <div className="mt-2 flex flex-col gap-3">
            {section.body.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
