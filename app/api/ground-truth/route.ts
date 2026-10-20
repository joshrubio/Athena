import { NextRequest, NextResponse } from "next/server";

// Real street-level imagery near the mission area, via Mapillary's Image
// Radius Search (graph.mapillary.com/images?lat&lng&radius&limit) — genuine
// public photographs, not the drone's own camera. Max radius is 50m (a
// Mapillary API limit), so most mission areas won't have a hit; that's
// reported honestly rather than widened or faked.
const MAPILLARY_URL = "https://graph.mapillary.com/images";
const FIELDS = "id,thumb_1024_url,captured_at,compass_angle,geometry";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const token = process.env.MAPILLARY_CLIENT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Mapillary isn't configured on this deployment." }, { status: 501 });
  }

  const url = `${MAPILLARY_URL}?fields=${FIELDS}&lat=${lat}&lng=${lng}&radius=50&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `OAuth ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Mapillary error", res.status, text);
      return NextResponse.json({ error: "Mapillary request failed." }, { status: 502 });
    }
    const data = await res.json();
    const image = data.data?.[0] ?? null;
    return NextResponse.json({ image });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Mapillary request failed." }, { status: 502 });
  }
}
