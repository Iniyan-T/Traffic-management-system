import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LaneAnalytics } from "@/lib/traffic/analytics-types"

const LANE_NAMES: Record<number, string> = {
  1: "Lane 1 (North)",
  2: "Lane 2 (East)",
  3: "Lane 3 (South)",
  4: "Lane 4 (West)",
}

export function LaneStatsTable({ lanes }: { lanes: LaneAnalytics[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lane</TableHead>
          <TableHead className="text-right">Avg. density</TableHead>
          <TableHead className="text-right">Avg. wait</TableHead>
          <TableHead className="text-right">Max wait</TableHead>
          <TableHead className="text-right">Green phases</TableHead>
          <TableHead className="text-right">Avg. green</TableHead>
          <TableHead className="text-right">Signal share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lanes.map((lane) => (
          <TableRow key={lane.lane}>
            <TableCell className="font-medium text-foreground">{LANE_NAMES[lane.lane]}</TableCell>
            <TableCell className="text-right tabular-nums">{lane.avgDensity}</TableCell>
            <TableCell className="text-right tabular-nums">{lane.avgWaitingTime}s</TableCell>
            <TableCell className="text-right tabular-nums">{lane.maxWaitingTime}s</TableCell>
            <TableCell className="text-right tabular-nums">{lane.greenPhases}</TableCell>
            <TableCell className="text-right tabular-nums">{lane.avgGreenDuration}s</TableCell>
            <TableCell className="text-right tabular-nums">{lane.signalUsagePercent}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
