/**
 * Traffic density model.
 *
 * IMPORTANT PROJECT ASSUMPTION: a single HC-SR04 ultrasonic sensor cannot literally
 * count individual vehicles. In this prototype, the measured distance is used as an
 * estimate of queue extent / occupancy in the sensor's detection lane - the closer an
 * obstruction, the more vehicles are assumed to be queued in front of the sensor.
 */

export type DensityLabel = "EMPTY" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"

export const DENSITY_LABELS: Record<number, DensityLabel> = {
  0: "EMPTY",
  1: "VERY_LOW",
  2: "LOW",
  3: "MEDIUM",
  4: "HIGH",
  5: "VERY_HIGH",
}

export function densityScoreFromDistance(distanceCm: number): number {
  // Closer obstruction => more vehicles queued => higher density score.
  if (distanceCm <= 0) return 0
  if (distanceCm > 50) return 0
  if (distanceCm > 40) return 1
  if (distanceCm > 30) return 2
  if (distanceCm > 20) return 3
  if (distanceCm > 10) return 4
  return 5
}

export function densityPercentFromScore(score: number): number {
  return score * 20
}

export function densityLabel(score: number): DensityLabel {
  return DENSITY_LABELS[score] ?? "EMPTY"
}
