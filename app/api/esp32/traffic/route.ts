import { ingestTrafficSnapshot } from "@/lib/traffic/ingest"
import { NextRequest, NextResponse } from "next/server"

interface Esp32Payload {
  lane1?: { distance: number }
  lane2?: { distance: number }
  lane3?: { distance: number }
  lane4?: { distance: number }
}

/**
 * POST /api/esp32/traffic
 *
 * Ingests raw ultrasonic distance readings from the ESP32.
 * Body: { "lane1": { "distance": 35 }, "lane2": { "distance": 20 }, ... }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const snapshot = await ingestTrafficSnapshot(body)
    return NextResponse.json({ status: "success", message: "Traffic data received", snapshot })
  } catch (error) {
    console.error("[v0] /api/esp32/traffic error:", error)
    return NextResponse.json({ error: "Failed to ingest sensor data" }, { status: 500 })
  }
}
