import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SignalLight } from "@/components/signal-light"
import { cn } from "@/lib/utils"
import type { LaneState } from "@/lib/traffic/types"
import { Ruler, TimerReset, WifiOff } from "lucide-react"

const LANE_NAMES: Record<number, string> = {
  1: "Lane 1 · North",
  2: "Lane 2 · East",
  3: "Lane 3 · South",
  4: "Lane 4 · West",
}

export function LaneCard({ lane, isTopPriority }: { lane: LaneState; isTopPriority: boolean }) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 p-4 transition-colors",
        lane.signal === "GREEN" && "border-signal-green/40 bg-signal-green-dim/10",
        isTopPriority && lane.signal !== "GREEN" && "border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">{LANE_NAMES[lane.laneNumber]}</h3>
            {!lane.sensorOnline && <WifiOff className="h-3.5 w-3.5 text-muted-foreground" aria-label="Sensor offline" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {lane.signal === "GREEN" ? `${lane.greenRemaining}s remaining` : `Priority ${lane.priority}`}
          </p>
        </div>
        <SignalLight active={lane.signal} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
          {lane.distance.toFixed(0)} cm
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TimerReset className="h-3.5 w-3.5" aria-hidden="true" />
          {lane.waitingTime}s waiting
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Density</span>
          <span>{lane.densityPercent}%</span>
        </div>
        <Progress value={lane.densityPercent} className="h-1.5" />
      </div>

      <div className="flex items-center justify-between">
        {isTopPriority ? (
          <Badge className="border-primary/30 bg-primary/15 text-primary">Highest priority</Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">Score {lane.priority}</span>
        )}
        <Badge
          variant="outline"
          className={cn(
            "capitalize",
            lane.signal === "GREEN" && "border-signal-green/30 text-signal-green",
            lane.signal === "YELLOW" && "border-signal-yellow/30 text-signal-yellow",
            lane.signal === "RED" && "border-signal-red/30 text-signal-red",
          )}
        >
          {lane.signal.toLowerCase()}
        </Badge>
      </div>
    </Card>
  )
}
