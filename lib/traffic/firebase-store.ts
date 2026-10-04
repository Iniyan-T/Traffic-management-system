import type { AnalyticsResponse, DensityReading, LaneAnalytics, SignalEvent } from "./analytics-types"
import { densityPercentFromScore, densityScoreFromDistance } from "./density"
import { buildSelectionReason, computeGreenDuration, computePriority } from "./priority"
import type { LaneState, SettingsState, TrafficState } from "./types"

export interface TrafficSnapshot {
  lane1: number
  lane2: number
  lane3: number
  lane4: number
  emergency: boolean
  emergencyLane: number
  currentSignal: number
}

export interface EmergencyEvent {
  id: number
  timestamp: string
  lane: number
  duration: number
  status: string
  reason: string
}

interface FirebaseRootState {
  traffic: TrafficSnapshot
  settings: SettingsState
  lanes: LaneState[]
  signalEvents: SignalEvent[]
  emergencyEvents: EmergencyEvent[]
  trafficReadings: DensityReading[]
}

const FIREBASE_BASE_URL =
  process.env.FIREBASE_DATABASE_URL ??
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
  "https://smart-traffic-648cb-default-rtdb.firebaseio.com"

const TRAFFIC_PATH = "traffic"
const SETTINGS_PATH = "settings"
const LANES_PATH = "lanes"
const SIGNAL_EVENTS_PATH = "signalEvents"
const EMERGENCY_EVENTS_PATH = "emergencyEvents"
const TRAFFIC_READINGS_PATH = "trafficReadings"

const DEFAULT_TRAFFIC: TrafficSnapshot = {
  lane1: 35,
  lane2: 12,
  lane3: 48,
  lane4: 28,
  emergency: false,
  emergencyLane: 0,
  currentSignal: 2,
}

const DEFAULT_SETTINGS: SettingsState = {
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
  phaseEndsAt: new Date().toISOString(),
  activeLane: 2,
  roundRobinPointer: 3,
  emergencyActive: false,
  emergencyLane: null,
  emergencyEndsAt: null,
  lastTickAt: new Date().toISOString(),
  esp32Connected: true,
  esp32LastSeen: new Date().toISOString(),
  selectionReason: "Lane 2 selected because it has the highest calculated priority.",
}

let initialised = false

function firebaseUrl(path: string) {
  return `${FIREBASE_BASE_URL}/${path}.json`
}

async function firebaseGet<T>(path: string): Promise<T | null> {
  const response = await fetch(firebaseUrl(path), { cache: "no-store" })
  if (!response.ok) throw new Error(`Firebase GET ${path} failed with status ${response.status}`)
  return (await response.json()) as T | null
}

async function firebasePut<T>(path: string, value: T): Promise<T> {
  const response = await fetch(firebaseUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`Firebase PUT ${path} failed with status ${response.status}`)
  return (await response.json()) as T
}

async function firebasePatch<T>(path: string, value: Partial<T>): Promise<T> {
  const response = await fetch(firebaseUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`Firebase PATCH ${path} failed with status ${response.status}`)
  return (await response.json()) as T
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value
}

function trafficFromAny(value: unknown): TrafficSnapshot {
  const traffic = (value ?? {}) as Record<string, unknown>
  return {
    lane1: Number(traffic.lane1 ?? DEFAULT_TRAFFIC.lane1),
    lane2: Number(traffic.lane2 ?? DEFAULT_TRAFFIC.lane2),
    lane3: Number(traffic.lane3 ?? DEFAULT_TRAFFIC.lane3),
    lane4: Number(traffic.lane4 ?? DEFAULT_TRAFFIC.lane4),
    emergency: Boolean(traffic.emergency ?? DEFAULT_TRAFFIC.emergency),
    emergencyLane: Number(traffic.emergencyLane ?? DEFAULT_TRAFFIC.emergencyLane),
    currentSignal: Number(traffic.currentSignal ?? DEFAULT_TRAFFIC.currentSignal),
  }
}

function buildLaneState(laneNumber: number, distance: number, settings: SettingsState, signal: LaneState["signal"]): LaneState {
  const densityScore = densityScoreFromDistance(distance)
  const densityPercent = densityPercentFromScore(densityScore)
  const waitingTime = 0
  const priority = computePriority(densityScore, waitingTime, settings.densityWeight, settings.waitingWeight)
  const greenDuration = computeGreenDuration(settings.baseGreenTime, settings.greenMultiplier, densityScore)

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
    updatedAt: new Date().toISOString(),
  }
}

function normalizeSettings(value: unknown, traffic: TrafficSnapshot): SettingsState {
  const current = (value ?? {}) as Partial<SettingsState>
  const activeLane = Number(current.activeLane ?? traffic.currentSignal ?? 1) || 1
  const emergencyActive = Boolean(current.emergencyActive ?? traffic.emergency)
  return {
    id: 1,
    densityWeight: Number(current.densityWeight ?? DEFAULT_SETTINGS.densityWeight),
    waitingWeight: Number(current.waitingWeight ?? DEFAULT_SETTINGS.waitingWeight),
    baseGreenTime: Number(current.baseGreenTime ?? DEFAULT_SETTINGS.baseGreenTime),
    greenMultiplier: Number(current.greenMultiplier ?? DEFAULT_SETTINGS.greenMultiplier),
    yellowDuration: Number(current.yellowDuration ?? DEFAULT_SETTINGS.yellowDuration),
    allRedDuration: Number(current.allRedDuration ?? DEFAULT_SETTINGS.allRedDuration),
    maxWaitingTime: Number(current.maxWaitingTime ?? DEFAULT_SETTINGS.maxWaitingTime),
    emergencyDuration: Number(current.emergencyDuration ?? DEFAULT_SETTINGS.emergencyDuration),
    mode: (current.mode ?? (traffic.currentSignal ? "esp32" : "simulation")) as SettingsState["mode"],
    simulationRunning: Boolean(current.simulationRunning ?? DEFAULT_SETTINGS.simulationRunning),
    phase: (current.phase ?? DEFAULT_SETTINGS.phase) as SettingsState["phase"],
    phaseEndsAt: toIso(current.phaseEndsAt ?? DEFAULT_SETTINGS.phaseEndsAt),
    activeLane,
    roundRobinPointer: Number(current.roundRobinPointer ?? ((activeLane % 4) + 1)),
    emergencyActive,
    emergencyLane: current.emergencyLane ?? (emergencyActive ? traffic.emergencyLane || activeLane : null),
    emergencyEndsAt: current.emergencyEndsAt ? toIso(current.emergencyEndsAt) : null,
    lastTickAt: toIso(current.lastTickAt ?? new Date().toISOString()),
    esp32Connected: Boolean(current.esp32Connected ?? true),
    esp32LastSeen: current.esp32LastSeen ? toIso(current.esp32LastSeen) : new Date().toISOString(),
    selectionReason:
      current.selectionReason ?? `Lane ${activeLane} selected because it has the highest calculated priority.`,
  }
}

function buildInitialRoot(root: Record<string, unknown>): FirebaseRootState {
  const traffic = trafficFromAny(root[TRAFFIC_PATH])
  const settings = normalizeSettings(root[SETTINGS_PATH], traffic)
  const lanes = [
    buildLaneState(1, traffic.lane1, settings, settings.activeLane === 1 ? "GREEN" : "RED"),
    buildLaneState(2, traffic.lane2, settings, settings.activeLane === 2 ? "GREEN" : "RED"),
    buildLaneState(3, traffic.lane3, settings, settings.activeLane === 3 ? "GREEN" : "RED"),
    buildLaneState(4, traffic.lane4, settings, settings.activeLane === 4 ? "GREEN" : "RED"),
  ]

  const priorityWinner = lanes[settings.activeLane - 1] ?? lanes[0]
  const selectionReason =
    settings.selectionReason ??
    buildSelectionReason(
      {
        laneNumber: priorityWinner.laneNumber,
        densityScore: priorityWinner.densityScore,
        waitingTime: priorityWinner.waitingTime,
        priority: priorityWinner.priority,
      },
      lanes.map((lane) => ({
        laneNumber: lane.laneNumber,
        densityScore: lane.densityScore,
        waitingTime: lane.waitingTime,
        priority: lane.priority,
      })),
      settings.densityWeight,
      settings.waitingWeight,
    )

  const signalEvents = Array.isArray(root[SIGNAL_EVENTS_PATH])
    ? (root[SIGNAL_EVENTS_PATH] as SignalEvent[])
    : [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          lane: settings.activeLane,
          previousSignal: "RED",
          newSignal: "GREEN",
          density: priorityWinner.densityScore,
          waitingTime: priorityWinner.waitingTime,
          priority: priorityWinner.priority,
          greenDuration: priorityWinner.greenDuration,
          reason: selectionReason,
        },
      ]

  const emergencyEvents = Array.isArray(root[EMERGENCY_EVENTS_PATH])
    ? (root[EMERGENCY_EVENTS_PATH] as EmergencyEvent[])
    : []

  const trafficReadings = Array.isArray(root[TRAFFIC_READINGS_PATH])
    ? (root[TRAFFIC_READINGS_PATH] as DensityReading[])
    : lanes.map((lane, index) => ({
        id: index + 1,
        timestamp: new Date().toISOString(),
        lane: lane.laneNumber,
        distance: lane.distance,
        densityScore: lane.densityScore,
        waitingTime: lane.waitingTime,
      }))

  return { traffic, settings: { ...settings, selectionReason }, lanes, signalEvents, emergencyEvents, trafficReadings }
}

async function readRoot(): Promise<FirebaseRootState> {
  const root = (await firebaseGet<Record<string, unknown>>("")) ?? {}
  return buildInitialRoot(root)
}

async function writeRoot(partial: Partial<FirebaseRootState>) {
  await firebasePatch<Record<string, unknown>>("", partial as Record<string, unknown>)
}

async function appendEvent<T extends { id: number }>(path: string, item: T): Promise<T[]> {
  const root = (await firebaseGet<Record<string, unknown>>("")) ?? {}
  const current = Array.isArray(root[path]) ? (root[path] as T[]) : []
  const next = [...current, item]
  await firebasePut(path, next)
  return next
}

function computeLanesFromState(settings: SettingsState, traffic: TrafficSnapshot): LaneState[] {
  const distances = [traffic.lane1, traffic.lane2, traffic.lane3, traffic.lane4]
  return distances.map((distance, index) => {
    const laneNumber = index + 1
    const densityScore = densityScoreFromDistance(distance)
    const densityPercent = densityPercentFromScore(densityScore)
    const waitingTime = 0
    const priority = computePriority(densityScore, waitingTime, settings.densityWeight, settings.waitingWeight)
    const greenDuration = computeGreenDuration(settings.baseGreenTime, settings.greenMultiplier, densityScore)
    const isEmergencyLane = settings.emergencyActive && settings.emergencyLane === laneNumber
    const isActiveLane = !settings.emergencyActive && settings.activeLane === laneNumber

    return {
      laneNumber,
      distance,
      densityScore,
      densityPercent,
      signal: isEmergencyLane || isActiveLane ? "GREEN" : "RED",
      waitingTime,
      priority,
      greenDuration,
      greenRemaining: isEmergencyLane || isActiveLane ? greenDuration : 0,
      sensorOnline: true,
      updatedAt: new Date().toISOString(),
    }
  })
}

export async function ensureFirebaseState() {
  if (initialised) return readRoot()
  const root = (await firebaseGet<Record<string, unknown>>("")) ?? {}
  const initial = buildInitialRoot(root)
  await writeRoot({
    [TRAFFIC_PATH]: initial.traffic,
    [SETTINGS_PATH]: initial.settings,
    [LANES_PATH]: initial.lanes,
    [SIGNAL_EVENTS_PATH]: initial.signalEvents,
    [EMERGENCY_EVENTS_PATH]: initial.emergencyEvents,
    [TRAFFIC_READINGS_PATH]: initial.trafficReadings,
  })
  initialised = true
  return initial
}

export async function getFirebaseFullState(): Promise<TrafficState> {
  const root = await readRoot()
  return { settings: root.settings, lanes: root.lanes }
}

export async function getFirebaseSettings() {
  const root = await ensureFirebaseState()
  return clone(root.settings)
}

export async function updateFirebaseSettings(patch: Partial<SettingsState>) {
  const current = await getFirebaseSettings()
  const next = { ...current, ...patch }
  await writeRoot({ [SETTINGS_PATH]: next })
  const traffic = await getFirebaseTrafficSnapshot()
  const lanes = computeLanesFromState(next, traffic)
  await writeRoot({ [LANES_PATH]: lanes })
  return next
}

export async function resetFirebaseSettings() {
  const root = await ensureFirebaseState()
  const next = normalizeSettings(DEFAULT_SETTINGS, root.traffic)
  const lanes = computeLanesFromState(next, root.traffic)
  await writeRoot({ [SETTINGS_PATH]: next, [LANES_PATH]: lanes })
  return next
}

export async function getFirebaseTrafficSnapshot() {
  const root = await ensureFirebaseState()
  return clone(root.traffic)
}

export async function getFirebaseTrafficHistory(lane?: number) {
  const root = await ensureFirebaseState()
  const events = lane
    ? root.signalEvents.filter((event) => event.lane === lane)
    : root.signalEvents
  return clone(events)
}

export async function getFirebaseEmergencyEvents() {
  const root = await ensureFirebaseState()
  return clone(root.emergencyEvents)
}

export async function getFirebaseAnalytics(): Promise<AnalyticsResponse> {
  const root = await ensureFirebaseState()
  const totalEvents = root.signalEvents.length
  const lanes: LaneAnalytics[] = root.lanes.map((lane) => {
    const laneEvents = root.signalEvents.filter((event) => event.lane === lane.laneNumber)
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
    densityOverTime: clone(root.trafficReadings),
    totalGreenPhases: totalEvents,
  }
}

export async function setFirebaseTrafficSnapshot(payload: TrafficSnapshot) {
  const root = await ensureFirebaseState()
  const settings = {
    ...root.settings,
    mode: "esp32",
    esp32Connected: true,
    esp32LastSeen: new Date().toISOString(),
    emergencyActive: payload.emergency,
    emergencyLane: payload.emergency ? payload.emergencyLane : null,
    activeLane: payload.currentSignal || 1,
    lastTickAt: new Date().toISOString(),
  }
  const lanes = computeLanesFromState(settings, payload)
  const readingBase = root.trafficReadings.length
  const trafficReadings: DensityReading[] = lanes.map((lane, index) => ({
    id: readingBase + index + 1,
    timestamp: new Date().toISOString(),
    lane: lane.laneNumber,
    distance: lane.distance,
    densityScore: lane.densityScore,
    waitingTime: lane.waitingTime,
  }))

  await writeRoot({
    [TRAFFIC_PATH]: payload,
    [SETTINGS_PATH]: settings,
    [LANES_PATH]: lanes,
    [TRAFFIC_READINGS_PATH]: [...root.trafficReadings, ...trafficReadings],
  })

  return payload
}

export async function triggerFirebaseEmergency(lane: number, duration: number) {
  const root = await ensureFirebaseState()
  const now = new Date().toISOString()
  const settings = {
    ...root.settings,
    emergencyActive: true,
    emergencyLane: lane,
    emergencyEndsAt: new Date(Date.now() + duration * 1000).toISOString(),
    mode: "esp32" as const,
  }
  const lanes = root.lanes.map((currentLane) => ({
    ...currentLane,
    signal: currentLane.laneNumber === lane ? "GREEN" : "RED",
    greenRemaining: currentLane.laneNumber === lane ? duration : 0,
    updatedAt: now,
  }))
  const event: EmergencyEvent = {
    id: root.emergencyEvents.length + 1,
    timestamp: now,
    lane,
    duration,
    status: "ACTIVE",
    reason: `Emergency vehicle detected in Lane ${lane}. Signal override activated.`,
  }
  await writeRoot({ [SETTINGS_PATH]: settings, [LANES_PATH]: lanes, [EMERGENCY_EVENTS_PATH]: [...root.emergencyEvents, event] })
  return { settings, lanes }
}

export async function refreshFirebaseDerivedState() {
  const root = await ensureFirebaseState()
  const lanes = computeLanesFromState(root.settings, root.traffic)
  await writeRoot({ [LANES_PATH]: lanes })
  return { settings: root.settings, lanes }
}

export async function applyFirebaseTestAction(action:
  | { action: "set-distance"; lane: number; distance: number }
  | { action: "set-waiting"; lane: number; waitingTime: number }
  | { action: "reset-waiting" }
  | { action: "force-lane"; lane: number }
  | { action: "start-simulation" }
  | { action: "stop-simulation" }
  | { action: "reset-simulation" }) {
  const root = await ensureFirebaseState()
  const now = new Date().toISOString()

  if (action.action === "set-distance") {
    const lanes = root.lanes.map((lane) =>
      lane.laneNumber === action.lane ? { ...lane, distance: action.distance, updatedAt: now } : lane,
    )
    const traffic = { ...root.traffic, [`lane${action.lane}`]: action.distance } as TrafficSnapshot
    await writeRoot({ [LANES_PATH]: lanes, [TRAFFIC_PATH]: traffic })
    return getFirebaseFullState()
  }

  if (action.action === "set-waiting") {
    const lanes = root.lanes.map((lane) =>
      lane.laneNumber === action.lane ? { ...lane, waitingTime: Math.max(0, Math.round(action.waitingTime)), updatedAt: now } : lane,
    )
    await writeRoot({ [LANES_PATH]: lanes })
    return getFirebaseFullState()
  }

  if (action.action === "reset-waiting") {
    const lanes = root.lanes.map((lane) => ({ ...lane, waitingTime: 0, updatedAt: now }))
    await writeRoot({ [LANES_PATH]: lanes })
    return getFirebaseFullState()
  }

  if (action.action === "force-lane") {
    const selected = root.lanes.find((lane) => lane.laneNumber === action.lane) ?? root.lanes[0]
    const greenDuration = computeGreenDuration(root.settings.baseGreenTime, root.settings.greenMultiplier, selected.densityScore)
    const lanes = root.lanes.map((lane) => ({
      ...lane,
      signal: lane.laneNumber === action.lane ? "GREEN" : "RED",
      greenDuration: lane.laneNumber === action.lane ? greenDuration : lane.greenDuration,
      greenRemaining: lane.laneNumber === action.lane ? greenDuration : 0,
      waitingTime: lane.laneNumber === action.lane ? 0 : lane.waitingTime,
      updatedAt: now,
    }))
    const settings = {
      ...root.settings,
      activeLane: action.lane,
      phase: "GREEN" as const,
      phaseEndsAt: new Date(Date.now() + greenDuration * 1000).toISOString(),
      roundRobinPointer: (action.lane % 4) + 1,
      selectionReason: `Lane ${action.lane} manually forced to GREEN via Test Controller.`,
    }
    await writeRoot({ [LANES_PATH]: lanes, [SETTINGS_PATH]: settings })
    return { settings, lanes }
  }

  if (action.action === "start-simulation") {
    const settings = { ...root.settings, mode: "simulation" as const, simulationRunning: true }
    await writeRoot({ [SETTINGS_PATH]: settings })
    return getFirebaseFullState()
  }

  if (action.action === "stop-simulation") {
    const settings = { ...root.settings, simulationRunning: false }
    await writeRoot({ [SETTINGS_PATH]: settings })
    return getFirebaseFullState()
  }

  const settings: SettingsState = {
    ...DEFAULT_SETTINGS,
    mode: "simulation",
    simulationRunning: true,
    phase: "GREEN",
    activeLane: 1,
    roundRobinPointer: 2,
    phaseEndsAt: now,
    emergencyActive: false,
    emergencyLane: null,
    emergencyEndsAt: null,
    lastTickAt: now,
    esp32Connected: true,
    esp32LastSeen: now,
    selectionReason: "Simulation reset - Lane 1 selected as starting point.",
  }
  const lanes = root.lanes.map((lane, index) => ({
    ...lane,
    waitingTime: 0,
    distance: 20,
    densityScore: 2,
    densityPercent: 40,
    signal: index === 0 ? "GREEN" : "RED",
    greenRemaining: index === 0 ? 7 : 0,
    greenDuration: 7,
    updatedAt: now,
  }))
  const traffic: TrafficSnapshot = {
    lane1: 20,
    lane2: 20,
    lane3: 20,
    lane4: 20,
    emergency: false,
    emergencyLane: 0,
    currentSignal: 1,
  }
  await writeRoot({
    [SETTINGS_PATH]: settings,
    [LANES_PATH]: lanes,
    [TRAFFIC_PATH]: traffic,
    [SIGNAL_EVENTS_PATH]: [],
    [EMERGENCY_EVENTS_PATH]: [],
    [TRAFFIC_READINGS_PATH]: [],
  })
  return { settings, lanes }
}
