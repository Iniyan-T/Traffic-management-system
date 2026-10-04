"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SignalEvent } from "@/lib/traffic/analytics-types"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

const LANE_NAMES: Record<number, string> = {
  1: "Lane 1 (North)",
  2: "Lane 2 (East)",
  3: "Lane 3 (South)",
  4: "Lane 4 (West)",
}

const SIGNAL_CLASS: Record<string, string> = {
  RED: "border-signal-red/30 text-signal-red",
  YELLOW: "border-signal-yellow/30 text-signal-yellow",
  GREEN: "border-signal-green/30 text-signal-green",
}

export function HistoryView() {
  const [lane, setLane] = useState<string>("all")
  const query = lane === "all" ? "" : `?lane=${lane}`
  const { data, isLoading, error } = useSWR<{ events: SignalEvent[] }>(`/api/traffic/history${query}`, fetcher, {
    refreshInterval: 3000,
  })

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Signal History</h2>
          <p className="text-sm text-muted-foreground">Chronological log of every signal transition and its cause.</p>
        </div>
        <Select value={lane} onValueChange={(value) => setLane(value ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by lane" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lanes</SelectItem>
            <SelectItem value="1">Lane 1 (North)</SelectItem>
            <SelectItem value="2">Lane 2 (East)</SelectItem>
            <SelectItem value="3">Lane 3 (South)</SelectItem>
            <SelectItem value="4">Lane 4 (West)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-muted-foreground">No signal transitions recorded yet.</p>
        ) : (data?.events ?? []).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead>Transition</TableHead>
                <TableHead className="text-right">Density</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">Priority</TableHead>
                <TableHead className="text-right">Green</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {LANE_NAMES[event.lane]}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn("capitalize", SIGNAL_CLASS[event.previousSignal])}>
                        {event.previousSignal.toLowerCase()}
                      </Badge>
                      <span className="text-muted-foreground">to</span>
                      <Badge variant="outline" className={cn("capitalize", SIGNAL_CLASS[event.newSignal])}>
                        {event.newSignal.toLowerCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{event.density}</TableCell>
                  <TableCell className="text-right tabular-nums">{event.waitingTime}s</TableCell>
                  <TableCell className="text-right tabular-nums">{event.priority}</TableCell>
                  <TableCell className="text-right tabular-nums">{event.greenDuration}s</TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground" title={event.reason}>
                    {event.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">No signal transitions recorded yet.</p>
        )}
      </Card>
    </div>
  )
}
