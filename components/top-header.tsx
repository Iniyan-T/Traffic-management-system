"use client"

import { Badge } from "@/components/ui/badge"
import { MobileNav } from "@/components/mobile-nav"
import { useTrafficState } from "@/lib/traffic/use-traffic-state"
import { Siren, Wifi, WifiOff } from "lucide-react"

export function TopHeader() {
  const { state } = useTrafficState()
  const esp32Connected = state?.settings.esp32Connected ?? false
  const mode = state?.settings.mode ?? "simulation"
  const emergencyActive = state?.settings.emergencyActive ?? false

  return (
    <header className="flex h-16 min-w-0 items-center justify-between gap-3 border-b border-border bg-card/40 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
            <span className="md:hidden">Traffic Control</span>
            <span className="hidden md:inline">Adaptive Traffic Management System</span>
          </h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            Priority-based signal control · 4-lane intersection
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {emergencyActive && (
          <Badge className="gap-1.5 border-signal-red/30 bg-signal-red-dim text-signal-red">
            <Siren className="h-3 w-3" aria-hidden="true" />
            Emergency Override
          </Badge>
        )}
        <Badge
          variant="outline"
          className="gap-1.5 border-border text-muted-foreground capitalize"
        >
          {mode}
        </Badge>
        <Badge
          variant="outline"
          className={
            esp32Connected
              ? "gap-1.5 border-signal-green/30 bg-signal-green-dim text-signal-green"
              : "gap-1.5 border-border text-muted-foreground"
          }
        >
          {esp32Connected ? (
            <Wifi className="h-3 w-3" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3 w-3" aria-hidden="true" />
          )}
          {esp32Connected ? "ESP32 Live" : "Simulated"}
        </Badge>
      </div>
    </header>
  )
}
