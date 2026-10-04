"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTrafficState } from "@/lib/traffic/use-traffic-state"
import { cn } from "@/lib/utils"
import { AlertTriangle, Loader2, Siren } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LANE_NAMES: Record<number, string> = {
  1: "Lane 1 (North)",
  2: "Lane 2 (East)",
  3: "Lane 3 (South)",
  4: "Lane 4 (West)",
}

interface EmergencyEvent {
  id: number
  timestamp: string
  lane: number
  duration: number
  status: string
  reason: string
}

export function EmergencyView() {
  const { state, mutate } = useTrafficState() as ReturnType<typeof useTrafficState> & { mutate?: () => void }
  const { data, mutate: mutateHistory } = useSWR<{ events: EmergencyEvent[] }>("/api/emergency", fetcher, {
    refreshInterval: 3000,
  })
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const emergencyActive = state?.settings.emergencyActive ?? false
  const emergencyLane = state?.settings.emergencyLane ?? null

  async function trigger(lane: number) {
    setPending(lane)
    setError(null)
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lane }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to trigger emergency override")
      }
      mutateHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to trigger emergency override")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Emergency Override</h2>
        <p className="text-sm text-muted-foreground">
          Force priority green for an emergency vehicle. Overrides adaptive control for the configured duration.
        </p>
      </div>

      {emergencyActive && (
        <Card className="flex items-center gap-3 border-signal-red/40 bg-signal-red-dim/15 p-4">
          <Siren className="h-5 w-5 text-signal-red" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Emergency override active — {LANE_NAMES[emergencyLane ?? 0]}
            </p>
            <p className="text-xs text-muted-foreground">All other lanes are held red until the override clears.</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="flex items-center gap-2 border-signal-red/40 bg-signal-red-dim/15 p-3 text-sm text-signal-red">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((lane) => (
          <Card key={lane} className="flex flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">{LANE_NAMES[lane]}</h3>
            <p className="text-xs text-muted-foreground">
              Force this lane green immediately for an approaching emergency vehicle.
            </p>
            <Button
              variant="destructive"
              disabled={pending !== null || emergencyActive}
              onClick={() => trigger(lane)}
              className="mt-auto gap-2"
            >
              {pending === lane ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Siren className="h-4 w-4" aria-hidden="true" />
              )}
              Trigger override
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recent overrides</h3>
        {data && data.events.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{LANE_NAMES[event.lane]}</span>
                <span className="text-muted-foreground">{event.reason}</span>
                <span className="text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    event.status === "ACTIVE"
                      ? "border-signal-red/30 text-signal-red"
                      : "border-signal-green/30 text-signal-green",
                  )}
                >
                  {event.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No emergency overrides recorded yet.</p>
        )}
      </Card>
    </div>
  )
}
