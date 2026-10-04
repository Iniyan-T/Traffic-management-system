import { NextRequest, NextResponse } from "next/server"
import { getFirebaseAnalytics } from "@/lib/traffic/firebase-store"

/**
 * GET /api/analytics
 * Query params: from (ISO), to (ISO)
 */
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json(await getFirebaseAnalytics())
  } catch (error) {
    console.error("[v0] /api/analytics error:", error)
    return NextResponse.json(await getFirebaseAnalytics())
  }
}
