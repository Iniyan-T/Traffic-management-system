"use client"

import { Radar } from "lucide-react"
import { useTrafficState } from "@/lib/traffic/use-traffic-state"
import { SignalLight } from "@/components/signal-light"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function LiveTrafficPage() {
  const { state } = useTrafficState()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Live Traffic</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Raw sensor readings straight from each HC-SR04 unit, updated every second.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {state?.lanes.map((lane) => (
          <Card key={lane.laneNumber} className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Radar className="h-4 w-4 text-primary" />
                Lane {lane.laneNumber}
              </CardTitle>
              <SignalLight active={lane.signal} size="sm" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold tabular-nums">{lane.distance.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">cm to nearest vehicle</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Density</span>
                  <span>{lane.densityPercent}%</span>
                </div>
                <Progress value={lane.densityPercent} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sensor link</span>
                <Badge
                  variant="outline"
                  className={
                    lane.sensorOnline
                      ? "border-signal-green/40 bg-signal-green-dim/40 text-signal-green"
                      : "border-signal-red/40 bg-signal-red-dim/40 text-signal-red"
                  }
                >
                  {lane.sensorOnline ? "ONLINE" : "OFFLINE"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
