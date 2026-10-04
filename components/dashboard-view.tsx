"use client"

import { IntersectionDiagram } from "@/components/intersection-diagram"
import { LaneCard } from "@/components/lane-card"
import { PhaseBanner } from "@/components/phase-banner"
import { PriorityAnalysis } from "@/components/priority-analysis"
import { Card } from "@/components/ui/card"
import { useTrafficState } from "@/lib/traffic/use-traffic-state"
import { Loader2 } from "lucide-react"

export function DashboardView() {
  const { state, connected, isLoading } = useTrafficState()

  if (isLoading && !state) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (!state) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Unable to reach the traffic engine. {connected ? "" : "Retrying..."}
      </div>
    )
  }

  const { lanes, settings } = state
  const topPriorityLane = [...lanes].sort((a, b) => b.priority - a.priority)[0]?.laneNumber

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <PhaseBanner settings={settings} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lanes
            .sort((a, b) => a.laneNumber - b.laneNumber)
            .map((lane) => (
              <LaneCard key={lane.laneNumber} lane={lane} isTopPriority={lane.laneNumber === topPriorityLane} />
            ))}
        </div>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col items-center gap-3 p-4">
            <h3 className="self-start text-sm font-semibold text-foreground">Intersection Overview</h3>
            <IntersectionDiagram lanes={lanes} />
          </Card>
          <PriorityAnalysis lanes={lanes} settings={settings} />
        </div>
      </div>
    </div>
  )
}
