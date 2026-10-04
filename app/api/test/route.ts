import { NextRequest, NextResponse } from "next/server"
import { applyFirebaseTestAction } from "@/lib/traffic/firebase-store"

type TestAction =
  | { action: "set-distance"; lane: number; distance: number }
  | { action: "set-waiting"; lane: number; waitingTime: number }
  | { action: "reset-waiting" }
  | { action: "force-lane"; lane: number }
  | { action: "start-simulation" }
  | { action: "stop-simulation" }
  | { action: "reset-simulation" }

/**
 * Manual "Test Controller" panel actions - lets the project be demonstrated
 * without any physical ESP32 hardware connected.
 */
export async function POST(request: NextRequest) {
  let body: TestAction
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const state = await applyFirebaseTestAction(body as any)
    return NextResponse.json({ ok: true, state })
  } catch (error) {
    console.error("[v0] /api/test error:", error)
    return NextResponse.json({ error: "Failed to apply test action" }, { status: 500 })
  }
}
