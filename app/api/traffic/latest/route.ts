import { getLatestTrafficSnapshot } from "@/lib/traffic/ingest"
import { NextResponse } from "next/server"

/** GET /api/traffic/latest - latest raw traffic snapshot received from the ESP32. */
export async function GET() {
  try {
    const snapshot = await getLatestTrafficSnapshot()
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error("[v0] /api/traffic/latest error:", error)
    return NextResponse.json({ error: "Failed to load latest traffic snapshot" }, { status: 500 })
  }
}