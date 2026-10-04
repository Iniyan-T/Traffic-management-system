"use client"

import { SignalLight } from "@/components/signal-light"
import { cn } from "@/lib/utils"
import type { LaneState } from "@/lib/traffic/types"

const LABELS: Record<number, { name: string; position: string }> = {
  1: { name: "Lane 1 · North", position: "top" },
  2: { name: "Lane 2 · East", position: "right" },
  3: { name: "Lane 3 · South", position: "bottom" },
  4: { name: "Lane 4 · West", position: "left" },
}

export function IntersectionDiagram({ lanes }: { lanes: LaneState[] }) {
  const byLane = new Map(lanes.map((l) => [l.laneNumber, l]))

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* road cross */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-full w-[34%] bg-muted" />
        <div className="absolute h-[34%] w-full bg-muted" />
        <div className="absolute h-full w-[34%] border-x border-dashed border-border/60" />
        <div className="absolute h-[34%] w-full border-y border-dashed border-border/60" />
        <div className="absolute h-[34%] w-[34%] bg-secondary" />
      </div>

      {([1, 2, 3, 4] as const).map((laneNumber) => {
        const lane = byLane.get(laneNumber)
        const { name, position } = LABELS[laneNumber]
        if (!lane) return null

        const wrapperClass = {
          top: "left-1/2 top-2 -translate-x-1/2 flex-col items-center",
          right: "right-2 top-1/2 -translate-y-1/2 flex-row-reverse items-center",
          bottom: "left-1/2 bottom-2 -translate-x-1/2 flex-col-reverse items-center",
          left: "left-2 top-1/2 -translate-y-1/2 flex-row items-center",
        }[position]

        return (
          <div key={laneNumber} className={cn("absolute flex gap-2", wrapperClass)}>
            <SignalLight active={lane.signal} size="sm" />
            <div
              className={cn(
                "rounded-md border bg-card px-2 py-1 text-center shadow-sm",
                lane.signal === "GREEN" ? "border-signal-green/40" : "border-border",
              )}
            >
              <p className="text-[11px] font-medium text-foreground">{name}</p>
              <p className="text-[10px] text-muted-foreground">{lane.distance.toFixed(0)} cm</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
