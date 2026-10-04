export interface LaneAnalytics {
  lane: number
  avgWaitingTime: string
  avgDensity: string
  maxWaitingTime: number
  greenPhases: number
  avgGreenDuration: string
  signalUsagePercent: number
}

export interface DensityReading {
  id: number
  timestamp: string
  lane: number
  distance: number
  densityScore: number
  waitingTime: number
}

export interface AnalyticsResponse {
  lanes: LaneAnalytics[]
  densityOverTime: DensityReading[]
  totalGreenPhases: number
}

export interface SignalEvent {
  id: number
  timestamp: string
  lane: number
  previousSignal: string
  newSignal: string
  density: number
  waitingTime: number
  priority: number
  greenDuration: number
  reason: string
}
