/**
 * Priority-based adaptive traffic control.
 *
 * Priority = (densityScore * densityWeight) + (waitingTime * waitingWeight)
 *
 * The lane with the highest priority receives the green signal. Waiting time
 * accumulates for every lane that is NOT served, guaranteeing that a lane can
 * never be starved indefinitely.
 */
export function computePriority(
  densityScore: number,
  waitingTime: number,
  densityWeight: number,
  waitingWeight: number,
): number {
  return densityScore * densityWeight + waitingTime * waitingWeight
}

/** Base Green Time + (densityScore * Additional Time per unit density). */
export function computeGreenDuration(
  baseGreenTime: number,
  greenMultiplier: number,
  densityScore: number,
): number {
  return baseGreenTime + densityScore * greenMultiplier
}

export interface LaneSnapshot {
  laneNumber: number
  densityScore: number
  waitingTime: number
  priority: number
}

/**
 * Selects the lane that should receive the next green phase.
 * Ties are broken using round-robin order starting at `pointer` so that
 * no lane can be perpetually skipped when priorities are equal.
 */
export function selectNextLane(lanes: LaneSnapshot[], pointer: number): LaneSnapshot {
  const maxPriority = Math.max(...lanes.map((l) => l.priority))
  const tied = lanes.filter((l) => l.priority === maxPriority)
  if (tied.length === 1) return tied[0]

  // Round-robin tie break: walk forward from `pointer` and pick the first tied lane encountered.
  for (let i = 0; i < 4; i++) {
    const candidateLane = ((pointer - 1 + i) % 4) + 1
    const found = tied.find((l) => l.laneNumber === candidateLane)
    if (found) return found
  }
  return tied[0]
}

export function buildSelectionReason(
  selected: LaneSnapshot,
  all: LaneSnapshot[],
  densityWeight: number,
  waitingWeight: number,
): string {
  const others = all.filter((l) => l.laneNumber !== selected.laneNumber)
  const highestDensity = all.every((l) => selected.densityScore >= l.densityScore)
  const reasons: string[] = []
  if (highestDensity) reasons.push("highest traffic density")
  reasons.push(`waiting time factored in (${selected.waitingTime}s x ${waitingWeight})`)
  reasons.push("highest calculated priority")

  const breakdown = `Density ${selected.densityScore} x ${densityWeight} + Waiting ${selected.waitingTime} x ${waitingWeight} = Priority ${selected.priority}`
  const comparison = others
    .map((o) => `Lane ${o.laneNumber}: ${o.priority}`)
    .join(", ")

  return `Lane ${selected.laneNumber} selected because: ${reasons.join(", ")}. ${breakdown}. Compared to ${comparison}.`
}
