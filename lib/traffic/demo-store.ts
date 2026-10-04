import { densityPercentFromScore, densityScoreFromDistance } from "./density"
import { buildSelectionReason, computeGreenDuration, computePriority } from "./priority"
import type { AnalyticsResponse, DensityReading, LaneAnalytics, SignalEvent } from "./analytics-types"
import type { LaneState, SettingsState, TrafficState } from "./types"

export interface DemoTrafficPayload {
  lane1: number
  lane2: number
  lane3: number
  lane4: number
  emergency: boolean
  emergencyLane: number
  currentSignal: number
}

type DemoStore = {
  settings: SettingsState
  lanes: LaneState[]
  signalEvents: SignalEvent[]
  emergencyEvents: Array<{
    id: number
    timestamp: string
    lane: number
    duration: number
    status: string
    reason: string
  }>
  trafficReadings: DensityReading[]
  latestTraffic: DemoTrafficPayload
}

const now = () => new Date().toISOString()

function createLane(laneNumber: number, distance: number, waitingTime: number, signal: LaneState["signal"]): LaneState {
  const densityScore = densityScoreFromDistance(distance)
  const densityPercent = densityPercentFromScore(densityScore)
  const priority = computePriority(densityScore, waitingTime, 10, 1)
  const greenDuration = computeGreenDuration(3, 2, densityScore)

  return {
    laneNumber,
    distance,
    densityScore,
    densityPercent,
    signal,
    waitingTime,
    priority,
    greenDuration,
    greenRemaining: signal === "GREEN" ? greenDuration : 0,
    sensorOnline: true,
    updatedAt: now(),
  }
}

function createInitialStore(): DemoStore {
  const lanes = [
    createLane(1, 35, 6, "RED"),
    createLane(2, 12, 2, "GREEN"),
    createLane(3, 48, 12, "RED"),
    createLane(4, 28, 4, "RED"),
  ]

  const activeLane = 2
  const selectionReason = buildSelectionReason(
    {
      laneNumber: activeLane,
      densityScore: lanes[1].densityScore,
      waitingTime: lanes[1].waitingTime,
      priority: lanes[1].priority,
    },
    lanes.map((lane) => ({
      laneNumber: lane.laneNumber,
      densityScore: lane.densityScore,
      waitingTime: lane.waitingTime,
      priority: lane.priority,
    })),
    10,
    1,
  )

  const settings: SettingsState = {
    id: 1,
    densityWeight: 10,
    waitingWeight: 1,
    baseGreenTime: 3,
    greenMultiplier: 2,
    yellowDuration: 2,
    allRedDuration: 1,
    maxWaitingTime: 60,
    emergencyDuration: 15,
    mode: "simulation",
    simulationRunning: true,
    phase: "GREEN",
    phaseEndsAt: now(),
    activeLane,
    roundRobinPointer: 3,
    emergencyActive: false,
    emergencyLane: null,
    emergencyEndsAt: null,
    lastTickAt: now(),
    esp32Connected: true,
    esp32LastSeen: now(),
    selectionReason,
  }

  const signalEvents: SignalEvent[] = [
    {
      id: 1,
      timestamp: now(),
      lane: 2,
      previousSignal: "RED",
      newSignal: "GREEN",
      density: lanes[1].densityScore,
      waitingTime: lanes[1].waitingTime,
      priority: lanes[1].priority,
      greenDuration: lanes[1].greenDuration,
      reason: selectionReason,
    },
  ]

  const emergencyEvents = [
    {
      id: 1,
      timestamp: now(),
      lane: 3,
      duration: 15,
      status: "RESOLVED",
      reason: "Emergency override cleared in demo mode.",
    },
  ]

  const trafficReadings: DensityReading[] = lanes.map((lane, index) => ({
    id: index + 1,
    timestamp: now(),
    lane: lane.laneNumber,
    distance: lane.distance,
    densityScore: lane.densityScore,
    waitingTime: lane.waitingTime,
  }))

  return {
    settings,
    lanes,
    signalEvents,
    emergencyEvents,
    trafficReadings,
    latestTraffic: {
      lane1: lanes[0].distance,
      lane2: lanes[1].distance,
      lane3: lanes[2].distance,
      lane4: lanes[3].distance,
      emergency: false,
      emergencyLane: 0,
      currentSignal: 2,
    },
  }
}

const store = createInitialStore()

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function getDemoFullState(): TrafficState {
  return clone({ settings: store.settings, lanes: store.lanes })
}

export function getDemoSettings() {
  return clone(store.settings)
}

export function getDemoLanes() {
  return clone(store.lanes)
}

export function getDemoTrafficHistory(lane?: number) {
  const events = lane ? store.signalEvents.filter((event) => event.lane === lane) : store.signalEvents
  return clone(events)
}

export function getDemoEmergencyEvents() {
  return clone(store.emergencyEvents)
}

export function getDemoAnalytics(): AnalyticsResponse {
  const totalEvents = store.signalEvents.length
  const lanes: LaneAnalytics[] = store.lanes.map((lane) => {
    const laneEvents = store.signalEvents.filter((event) => event.lane === lane.laneNumber)
    const greenPhases = laneEvents.length
    const avgGreenDuration =
      greenPhases > 0 ? laneEvents.reduce((sum, event) => sum + event.greenDuration, 0) / greenPhases : 0
    return {
      lane: lane.laneNumber,
      avgWaitingTime: lane.waitingTime.toFixed(1),
      avgDensity: lane.densityScore.toFixed(1),
      maxWaitingTime: lane.waitingTime,
      greenPhases,
      avgGreenDuration: avgGreenDuration.toFixed(1),
      signalUsagePercent: totalEvents > 0 ? Math.round((greenPhases / totalEvents) * 100) : 0,
    }
  })

  return {
    lanes,
    densityOverTime: clone(store.trafficReadings),
    totalGreenPhases: totalEvents,
  }
}

export function updateDemoSettings(patch: Partial<SettingsState>) {
  store.settings = { ...store.settings, ...patch }
  return getDemoSettings()
}

export function resetDemoSettings() {
  const reset = createInitialStore()
  store.settings = reset.settings
  store.lanes = reset.lanes
  store.signalEvents = reset.signalEvents
  store.emergencyEvents = reset.emergencyEvents
  store.trafficReadings = reset.trafficReadings
  store.latestTraffic = reset.latestTraffic
  return getDemoSettings()
}

export function applyDemoTrafficSnapshot(payload: DemoTrafficPayload) {
  store.latestTraffic = payload
  const nowIso = now()
  const laneValues = [payload.lane1, payload.lane2, payload.lane3, payload.lane4]

  store.lanes = store.lanes.map((lane, index) => {
    const distance = laneValues[index]
    const densityScore = densityScoreFromDistance(distance)
    const densityPercent = densityPercentFromScore(densityScore)
    const priority = computePriority(densityScore, lane.waitingTime, store.settings.densityWeight, store.settings.waitingWeight)
    const greenDuration = computeGreenDuration(store.settings.baseGreenTime, store.settings.greenMultiplier, densityScore)

    return {
      ...lane,
      distance,
      densityScore,
      densityPercent,
      priority,
      greenDuration,
      sensorOnline: true,
      updatedAt: nowIso,
    }
  })

  store.settings = {
    ...store.settings,
    mode: "esp32",
    esp32Connected: true,
    esp32LastSeen: nowIso,
    emergencyActive: payload.emergency,
    emergencyLane: payload.emergency ? payload.emergencyLane : null,
    activeLane: payload.currentSignal,
    lastTickAt: nowIso,
  }

  store.trafficReadings = store.lanes.map((lane, index) => ({
    id: store.trafficReadings.length + index + 1,
    timestamp: nowIso,
    lane: lane.laneNumber,
    distance: lane.distance,
    densityScore: lane.densityScore,
    waitingTime: lane.waitingTime,
  }))

  return getDemoTrafficSnapshot()
}

export function triggerDemoEmergency(lane: number, duration: number) {
  const nowIso = now()
  store.settings = {
    ...store.settings,
    emergencyActive: true,
    emergencyLane: lane,
    emergencyEndsAt: new Date(Date.now() + duration * 1000).toISOString(),
    mode: "esp32",
  }
  store.emergencyEvents = [
    ...store.emergencyEvents,
    {
      id: store.emergencyEvents.length + 1,
      timestamp: nowIso,
      lane,
      duration,
      status: "ACTIVE",
      reason: `Emergency vehicle detected in Lane ${lane}. Signal override activated.`,
    },
  ]

  store.lanes = store.lanes.map((currentLane) => ({
    ...currentLane,
    signal: currentLane.laneNumber === lane ? "GREEN" : "RED",
    greenRemaining: currentLane.laneNumber === lane ? duration : 0,
    updatedAt: nowIso,
  }))

  return getDemoFullState()
}

export function getDemoTrafficSnapshot() {
  return clone(store.latestTraffic)
}
