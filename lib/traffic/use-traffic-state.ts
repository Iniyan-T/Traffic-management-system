"use client"

import useSWR from "swr"
import type { TrafficState } from "./types"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

/**
 * Polls the traffic engine every second. This is what drives the "live"
 * feel of the dashboard without a persistent WebSocket server, which is
 * not available on serverless hosting - the poll itself advances the
 * simulation each time it hits /api/state.
 */
export function useTrafficState() {
  const { data, error, isLoading } = useSWR<TrafficState>("/api/state", fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  return {
    state: data,
    connected: !error && !!data,
    isLoading,
    error,
  }
}
