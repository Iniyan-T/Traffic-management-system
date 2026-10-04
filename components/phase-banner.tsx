"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SettingsState } from "@/lib/traffic/types"
import { useEffect, useState } from "react"

const LANE_NAMES: Record<number, string> = {
  1: "Lane 1 (North)",
  2: "Lane 2 (East)",
  3: "Lane 3 (South)",
  4: "Lane 4 (West)",
}

export function PhaseBanner({ settings }: { settings: SettingsState }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const update = () => {
      const ms = new Date(settings.phaseEndsAt).getTime() - Date.now()
      setRemaining(Math.max(0, Math.ceil(ms / 1000)))
    }
    update()
    const id = setInterval(update, 250)
    return () => clearInterval(id)
  }, [settings.phaseEndsAt])

  const phaseLabel: Record<string, string> = {
    GREEN: "Green phase",
    YELLOW: "Yellow phase",
    ALL_RED: "All-red clearance",
  }

  return (
    <Card
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-l-2 p-4",
        settings.emergencyActive
          ? "border-l-signal-red bg-signal-red-dim/10"
          : settings.phase === "GREEN"
            ? "border-l-signal-green bg-signal-green-dim/10"
            : "border-l-signal-yellow bg-signal-yellow-dim/10",
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {settings.emergencyActive ? "Emergency override" : phaseLabel[settings.phase]}
        </p>
        <p className="text-lg font-semibold text-foreground">
          {settings.emergencyActive
            ? `Lane ${settings.emergencyLane} · priority clearance`
            : `${LANE_NAMES[settings.activeLane]} is active`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-3xl font-semibold tabular-nums text-foreground">{remaining}s</p>
        <p className="text-xs text-muted-foreground">until next transition</p>
      </div>
    </Card>
  )
}
