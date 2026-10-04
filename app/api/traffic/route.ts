import { ingestTrafficSnapshot } from "@/lib/traffic/ingest"
import { NextRequest, NextResponse } from "next/server"

/** POST /api/traffic - ingest combined ESP32 traffic payload. */
export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    await ingestTrafficSnapshot(body)
    return NextResponse.json({ status: "success", message: "Traffic data received" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ingest traffic data"
    const status = message.startsWith("Invalid") || message.startsWith("No valid") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}