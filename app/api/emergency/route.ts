import { getFullState } from "@/lib/traffic/engine"
import { getFirebaseEmergencyEvents, triggerFirebaseEmergency } from "@/lib/traffic/firebase-store"
import { NextRequest, NextResponse } from "next/server"

/** GET /api/emergency - recent emergency override events. */
export async function GET() {
  try {
    return NextResponse.json({ events: await getFirebaseEmergencyEvents() })
  } catch (error) {
    console.error("[v0] /api/emergency GET error:", error)
    return NextResponse.json({ events: await getFirebaseEmergencyEvents() })
  }
}

/**
 * POST /api/emergency
 * Body: { "lane": 2, "duration"?: 15 }
 * Overrides normal priority control - forces the given lane GREEN and all
 * others RED for the emergency duration, then resumes adaptive control.
 */
export async function POST(request: NextRequest) {
  let body: { lane?: number; duration?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const lane = Number(body.lane)
  if (!Number.isInteger(lane) || lane < 1 || lane > 4) {
    return NextResponse.json({ error: "lane must be an integer between 1 and 4" }, { status: 400 })
  }

  const duration = Number.isFinite(body.duration) && body.duration! > 0 ? body.duration! : 15

  try {
    const { settings } = await getFullState()
    const nextDuration = Number.isFinite(body.duration) && body.duration! > 0 ? body.duration! : settings.emergencyDuration
    await triggerFirebaseEmergency(lane, nextDuration)
    const state = await getFullState()
    return NextResponse.json({ ok: true, state })
  } catch (error) {
    console.error("[v0] /api/emergency error:", error)
    await triggerFirebaseEmergency(lane, duration)
    return NextResponse.json({ ok: true, state: await getFullState() })
  }
}
