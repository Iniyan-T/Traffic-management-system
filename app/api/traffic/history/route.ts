import { NextRequest, NextResponse } from "next/server"
import { getFirebaseTrafficHistory } from "@/lib/traffic/firebase-store"

/**
 * GET /api/traffic/history
 * Query params: lane, from (ISO), to (ISO), limit (default 50, max 500)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lane = searchParams.get("lane")

  try {
    return NextResponse.json({ events: await getFirebaseTrafficHistory(lane ? Number(lane) : undefined) })
  } catch (error) {
    console.error("[v0] /api/traffic/history error:", error)
    return NextResponse.json({ events: await getFirebaseTrafficHistory(lane ? Number(lane) : undefined) })
  }
}
