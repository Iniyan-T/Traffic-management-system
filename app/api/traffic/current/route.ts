import { tickEngine } from "@/lib/traffic/engine"
import { NextResponse } from "next/server"

/** GET /api/traffic/current - current intersection snapshot (per API spec). */
export async function GET() {
  try {
    const state = await tickEngine()
    return NextResponse.json(state)
  } catch (error) {
    console.error("[v0] /api/traffic/current error:", error)
    return NextResponse.json({ error: "Failed to read traffic state" }, { status: 500 })
  }
}
