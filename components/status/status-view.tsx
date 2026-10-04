"use client"

import useSWR from "swr"
import { Activity, Database, Server, Radio, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StatusResponse {
  backend: string
  database: string
  realtime: string
  mode: string
  esp32: { status: string; lastSeen: string | null; secondsSinceLastSeen: number | null }
  lanes: { lane: number; sensor: string; lastUpdate: string }[]
  emergencyActive: boolean
  lastUpdate: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

function StatusPill({ label, value, online }: { label: string; value: string; online: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge
        variant="outline"
        className={
          online
            ? "border-signal-green/40 bg-signal-green-dim/40 text-signal-green"
            : "border-signal-red/40 bg-signal-red-dim/40 text-signal-red"
        }
      >
        {value}
      </Badge>
    </div>
  )
}

export function StatusView() {
  const { data } = useSWR<StatusResponse>("/api/system/status", fetcher, { refreshInterval: 1000 })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">System Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Health of the backend, database, and connected hardware.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Server className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-signal-green">{data?.backend ?? "…"}</div>
            <p className="text-xs text-muted-foreground">Next.js API routes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-signal-green">{data?.database ?? "…"}</div>
            <p className="text-xs text-muted-foreground">Firebase Realtime Database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Radio className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Realtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">{data?.realtime ?? "…"}</div>
            <p className="text-xs text-muted-foreground">1s SWR polling</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            {data?.esp32?.status === "CONNECTED" ? (
              <Wifi className="h-4 w-4 text-signal-green" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm font-medium">ESP32</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={
                "text-lg font-semibold " +
                (data?.esp32?.status === "CONNECTED" ? "text-signal-green" : "text-muted-foreground")
              }
            >
              {data?.esp32?.status ?? "…"}
            </div>
            <p className="text-xs text-muted-foreground">
              Mode: {data?.mode === "esp32" ? "Hardware" : "Simulation"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-primary" />
            Sensor Link Status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {data?.lanes?.map((l) => (
            <StatusPill key={l.lane} label={`Lane ${l.lane} - HC-SR04`} value={l.sensor} online={l.sensor === "ONLINE"} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6 text-sm text-muted-foreground">
          <span>Emergency override: {data?.emergencyActive ? "ACTIVE" : "Inactive"}</span>
          <span>Last engine tick: {data ? new Date(data.lastUpdate).toLocaleTimeString() : "…"}</span>
        </CardContent>
      </Card>
    </div>
  )
}
