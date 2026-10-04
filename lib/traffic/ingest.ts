import { getFirebaseTrafficSnapshot, setFirebaseTrafficSnapshot } from "./firebase-store"

export interface TrafficSnapshot {
  lane1: number
  lane2: number
  lane3: number
  lane4: number
  emergency: boolean
  emergencyLane: number
  currentSignal: number
}

let latestTrafficSnapshot: TrafficSnapshot | null = null

function normalizeLaneValue(value: unknown, lane: number) {
  const distance = Number(value)

  if (!Number.isFinite(distance) || distance < 0 || distance > 500) {
    throw new Error(`Invalid distance value for lane ${lane}: ${String(value)}`)
  }

  return distance
}

export async function ingestTrafficSnapshot(payload: unknown) {
  if (payload == null || typeof payload !== "object") {
    throw new Error("Invalid JSON body")
  }

  const body = payload as Record<string, unknown>
  const snapshot: TrafficSnapshot = {
    lane1: normalizeLaneValue(body.lane1, 1),
    lane2: normalizeLaneValue(body.lane2, 2),
    lane3: normalizeLaneValue(body.lane3, 3),
    lane4: normalizeLaneValue(body.lane4, 4),
    emergency: Boolean(body.emergency),
    emergencyLane: Number(body.emergencyLane) || 0,
    currentSignal: Number(body.currentSignal) || 0,
  }

  latestTrafficSnapshot = snapshot
  await setFirebaseTrafficSnapshot(snapshot)
  return snapshot
}

export async function getLatestTrafficSnapshot() {
  if (latestTrafficSnapshot) return latestTrafficSnapshot
  return getFirebaseTrafficSnapshot()
}