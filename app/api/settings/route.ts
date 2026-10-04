import { NextRequest, NextResponse } from "next/server"
import { getFirebaseSettings, resetFirebaseSettings, updateFirebaseSettings } from "@/lib/traffic/firebase-store"

export async function GET() {
  try {
    return NextResponse.json(await getFirebaseSettings())
  } catch (error) {
    console.error("[v0] /api/settings GET error:", error)
    return NextResponse.json(await getFirebaseSettings())
  }
}

const ALLOWED_KEYS = [
  "densityWeight",
  "waitingWeight",
  "baseGreenTime",
  "greenMultiplier",
  "yellowDuration",
  "allRedDuration",
  "maxWaitingTime",
  "emergencyDuration",
  "mode",
  "simulationRunning",
] as const

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (body.reset === true) {
    try {
      return NextResponse.json(await resetFirebaseSettings())
    } catch (error) {
      console.error("[v0] /api/settings reset error:", error)
      return NextResponse.json(await resetFirebaseSettings())
    }
  }

  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_KEYS) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid settings fields provided" }, { status: 400 })
  }

  try {
    return NextResponse.json(await updateFirebaseSettings(update as any))
  } catch (error) {
    console.error("[v0] /api/settings error:", error)
    return NextResponse.json(await updateFirebaseSettings(update as any))
  }
}
