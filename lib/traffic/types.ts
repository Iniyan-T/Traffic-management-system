export type Signal = "RED" | "YELLOW" | "GREEN"
export type Phase = "GREEN" | "YELLOW" | "ALL_RED"
export type Mode = "simulation" | "esp32"

export interface LaneState {
  laneNumber: number
  distance: number
  densityScore: number
  densityPercent: number
  signal: Signal
  waitingTime: number
  priority: number
  greenDuration: number
  greenRemaining: number
  sensorOnline: boolean
  updatedAt: string
}

export interface SettingsState {
  id: number
  densityWeight: number
  waitingWeight: number
  baseGreenTime: number
  greenMultiplier: number
  yellowDuration: number
  allRedDuration: number
  maxWaitingTime: number
  emergencyDuration: number
  mode: Mode
  simulationRunning: boolean
  phase: Phase
  phaseEndsAt: string
  activeLane: number
  roundRobinPointer: number
  emergencyActive: boolean
  emergencyLane: number | null
  emergencyEndsAt: string | null
  lastTickAt: string
  esp32Connected: boolean
  esp32LastSeen: string | null
  selectionReason: string
}

export interface TrafficState {
  settings: SettingsState
  lanes: LaneState[]
}
