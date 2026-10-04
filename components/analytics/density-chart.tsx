"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { DensityReading } from "@/lib/traffic/analytics-types"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

const LANE_KEYS = ["lane1", "lane2", "lane3", "lane4"] as const

const chartConfig: ChartConfig = {
  lane1: { label: "Lane 1 (North)", color: "var(--chart-1)" },
  lane2: { label: "Lane 2 (East)", color: "var(--chart-2)" },
  lane3: { label: "Lane 3 (South)", color: "var(--chart-3)" },
  lane4: { label: "Lane 4 (West)", color: "var(--chart-4)" },
}

export function DensityChart({ readings = [] }: { readings?: DensityReading[] }) {
  // Each engine tick inserts one row per lane in quick succession, so exact timestamps rarely match
  // across lanes. Bucket into 1-second windows instead, so all 4 lanes land in the same chart point.
  const byTime = new Map<number, Record<string, number | string>>()
  for (const r of readings) {
    const bucketMs = Math.round(new Date(r.timestamp).getTime() / 1000) * 1000
    const row = byTime.get(bucketMs) ?? { time: new Date(bucketMs).toLocaleTimeString() }
    row[`lane${r.lane}`] = r.densityScore
    byTime.set(bucketMs, row)
  }
  const data = Array.from(byTime.entries())
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        No sensor readings recorded yet.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 5]} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {LANE_KEYS.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
