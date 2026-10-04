"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { LaneAnalytics } from "@/lib/traffic/analytics-types"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const chartConfig: ChartConfig = {
  greenPhases: { label: "Green phases", color: "var(--chart-1)" },
}

const LANE_LABELS: Record<number, string> = {
  1: "Lane 1",
  2: "Lane 2",
  3: "Lane 3",
  4: "Lane 4",
}

export function SignalUsageChart({ lanes }: { lanes: LaneAnalytics[] }) {
  const data = lanes.map((l) => ({ lane: LANE_LABELS[l.lane], greenPhases: l.greenPhases }))

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="lane" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="greenPhases" fill="var(--color-greenPhases)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
