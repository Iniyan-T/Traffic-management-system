"use client"

import useSWR from "swr"
import { Cpu, Radar, Lightbulb, Loader2, Wifi } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface GpioConfig {
  gpio: {
    sensors: { lane: number; trig: string; echo: string }[]
    leds: { lane: number; red: string; yellow: string; green: string }[]
  }
}

interface FirebaseTrafficSnapshot {
  lane1: number
  lane2: number
  lane3: number
  lane4: number
  emergency: boolean
  emergencyLane: number
  currentSignal: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

const FIREBASE_TRAFFIC_URL = "https://smart-traffic-648cb-default-rtdb.firebaseio.com/traffic.json"

export default function HardwarePage() {
  const { data } = useSWR<GpioConfig>("/api/system/status", fetcher)
  const {
    data: traffic,
    isLoading: isTrafficLoading,
    error: trafficError,
  } = useSWR<FirebaseTrafficSnapshot>(FIREBASE_TRAFFIC_URL, fetcher, {
    refreshInterval: 2000,
  })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Hardware Reference</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ESP32 wiring for the 4 HC-SR04 ultrasonic sensors and 4 sets of RGB signal LEDs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Wifi className="h-4 w-4 text-primary" />
            Firebase Traffic Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTrafficLoading && !traffic ? (
            <div className="flex h-28 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : trafficError ? (
            <p className="text-sm text-muted-foreground">Unable to load traffic data from Firebase.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Lane 1</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.lane1 ?? "…"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Lane 2</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.lane2 ?? "…"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Lane 3</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.lane3 ?? "…"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Lane 4</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.lane4 ?? "…"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Emergency</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.emergency ? "Active" : "Inactive"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Emergency Lane</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.emergencyLane ?? "…"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 sm:col-span-2 lg:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Current Signal</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{traffic?.currentSignal ?? "…"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Radar className="h-4 w-4 text-primary" />
            HC-SR04 Ultrasonic Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lane</TableHead>
                <TableHead>TRIG Pin</TableHead>
                <TableHead>ECHO Pin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.gpio?.sensors?.map((s) => (
                <TableRow key={s.lane}>
                  <TableCell className="font-medium">Lane {s.lane}</TableCell>
                  <TableCell className="font-mono text-sm">{s.trig}</TableCell>
                  <TableCell className="font-mono text-sm">{s.echo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-primary" />
            Signal LEDs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lane</TableHead>
                <TableHead className="text-signal-red">Red</TableHead>
                <TableHead className="text-signal-yellow">Yellow</TableHead>
                <TableHead className="text-signal-green">Green</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.gpio?.leds?.map((l) => (
                <TableRow key={l.lane}>
                  <TableCell className="font-medium">Lane {l.lane}</TableCell>
                  <TableCell className="font-mono text-sm">{l.red}</TableCell>
                  <TableCell className="font-mono text-sm">{l.yellow}</TableCell>
                  <TableCell className="font-mono text-sm">{l.green}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Cpu className="h-4 w-4 text-primary" />
            Controller
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          ESP32 DevKit reads all 4 HC-SR04 sensors every cycle, posts distance readings to{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
            POST /api/esp32/traffic
          </code>
          , then drives the 12 LED outputs directly from the response, or you can let the backend own the LED
          state and only report distances.
        </CardContent>
      </Card>
    </div>
  )
}
