import { Card } from "@/components/ui/card"
import type { LaneState, SettingsState } from "@/lib/traffic/types"
import { BrainCircuit } from "lucide-react"

const LANE_NAMES: Record<number, string> = {
  1: "Lane 1 (North)",
  2: "Lane 2 (East)",
  3: "Lane 3 (South)",
  4: "Lane 4 (West)",
}

export function PriorityAnalysis({ lanes, settings }: { lanes: LaneState[]; settings: SettingsState }) {
  const sorted = [...lanes].sort((a, b) => b.priority - a.priority)
  const max = Math.max(...lanes.map((l) => l.priority), 1)

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">Priority Analysis</h3>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Last decision
        </span>
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {settings.selectionReason}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Live ranking
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((lane, index) => (
          <div key={lane.laneNumber} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-foreground">{LANE_NAMES[lane.laneNumber]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={index === 0 ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-primary/40"}
                style={{ width: `${Math.max((lane.priority / max) * 100, 4)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {lane.priority}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        priority = density × {settings.densityWeight} + waiting time × {settings.waitingWeight}
      </p>
    </Card>
  )
}
