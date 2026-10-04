"use client"

import { DensityChart } from "@/components/analytics/density-chart"
import { LaneStatsTable } from "@/components/analytics/lane-stats-table"
import { SignalUsageChart } from "@/components/analytics/signal-usage-chart"
import { Card } from "@/components/ui/card"
import type { AnalyticsResponse } from "@/lib/traffic/analytics-types"
import { Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export function AnalyticsView() {
  const { data, isLoading, error } = useSWR<AnalyticsResponse>("/api/analytics", fetcher, {
    refreshInterval: 5000,
  })

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Aggregated lane performance from sensor readings and signal decisions.
        </p>
      </div>

      {isLoading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">Unable to load analytics.</p>
      ) : data ? (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Density over time</h3>
              <DensityChart readings={data.densityOverTime} />
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Green phases per lane</h3>
              <SignalUsageChart lanes={data.lanes} />
            </Card>
          </div>

          <Card className="overflow-x-auto p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Lane performance summary</h3>
            <LaneStatsTable lanes={data.lanes} />
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Unable to load analytics.</p>
      )}
    </div>
  )
}
