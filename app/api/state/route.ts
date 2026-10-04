import { tickEngine } from "@/lib/traffic/engine"
import { NextResponse } from "next/server"

/**
 * Advances the traffic engine and returns the full live snapshot.
 * The dashboard polls this endpoint every second - this is what drives
 * the simulation forward in a serverless-friendly way (no background process).
 */
export async function GET() {
  try {
    const state = await tickEngine()
    return NextResponse.json(state)
  } catch (error) {
    console.error("[v0] /api/state error:", error)
    return NextResponse.json({ error: "Failed to read traffic state" }, { status: 500 })
  }
}
