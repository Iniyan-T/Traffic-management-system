import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Endpoint {
  method: "GET" | "POST" | "PUT"
  path: string
  description: string
  body?: string
  response?: string
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/state",
    description: "Full live state: all 4 lanes plus current settings/phase. Polled every second by the dashboard.",
    response: "{ lanes: Lane[], settings: Settings }",
  },
  {
    method: "GET",
    path: "/api/traffic/current",
    description: "Current lane readings only (distance, density, signal).",
    response: "{ lanes: Lane[] }",
  },
  {
    method: "GET",
    path: "/api/traffic/history",
    description: "Historical sensor readings for charts. Supports ?lane= and ?limit= query params.",
    response: "{ readings: TrafficReading[] }",
  },
  {
    method: "POST",
    path: "/api/esp32/traffic",
    description: "Hardware ingest endpoint. ESP32 posts raw distance readings for all 4 lanes here.",
    body: '{ readings: [{ lane: 1, distanceCm: 35 }, ...] }',
    response: "{ lanes: Lane[], settings: Settings }",
  },
  {
    method: "GET",
    path: "/api/emergency",
    description: "Recent emergency override events (most recent 50).",
    response: "{ events: EmergencyEvent[] }",
  },
  {
    method: "POST",
    path: "/api/emergency",
    description: "Trigger or clear an emergency override for a lane.",
    body: '{ lane: 1, action: "trigger" | "clear" }',
    response: "{ lanes: Lane[], settings: Settings }",
  },
  {
    method: "GET",
    path: "/api/settings",
    description: "Current algorithm configuration and simulation/mode state.",
    response: "{ densityWeight, waitingWeight, baseGreenTime, ... }",
  },
  {
    method: "PUT",
    path: "/api/settings",
    description: "Update algorithm weights, timers, or mode. Pass { reset: true } to restore defaults.",
    body: "{ densityWeight?: number, simulationRunning?: boolean, ... }",
    response: "Updated settings row",
  },
  {
    method: "GET",
    path: "/api/system/status",
    description: "Backend/database/ESP32 health snapshot plus GPIO wiring reference.",
    response: "{ backend, database, realtime, esp32, lanes, gpio }",
  },
  {
    method: "GET",
    path: "/api/analytics",
    description: "Aggregated per-lane stats and time-series density data for charts.",
    response: "{ laneStats: LaneStat[], densitySeries: DensityPoint[] }",
  },
]

const METHOD_STYLES: Record<Endpoint["method"], string> = {
  GET: "bg-primary/15 text-primary border-primary/30",
  POST: "bg-signal-green-dim/50 text-signal-green border-signal-green/30",
  PUT: "bg-signal-yellow-dim/50 text-signal-yellow border-signal-yellow/30",
}

export default function ApiDocsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">API Reference</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every route the dashboard and ESP32 firmware use to read and drive the traffic engine.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ENDPOINTS.map((e) => (
          <Card key={e.method + e.path}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Badge variant="outline" className={METHOD_STYLES[e.method] + " font-mono"}>
                {e.method}
              </Badge>
              <CardTitle className="font-mono text-sm font-medium">{e.path}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="text-muted-foreground leading-relaxed">{e.description}</p>
              {e.body && (
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="text-xs font-medium text-muted-foreground">Body</span>
                  <pre className="mt-1 overflow-x-auto font-mono text-xs text-foreground">{e.body}</pre>
                </div>
              )}
              {e.response && (
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="text-xs font-medium text-muted-foreground">Response</span>
                  <pre className="mt-1 overflow-x-auto font-mono text-xs text-foreground">{e.response}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
