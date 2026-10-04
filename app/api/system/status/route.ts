import { getFullState } from "@/lib/traffic/engine"
import { NextResponse } from "next/server"

const GPIO_CONFIG = {
  sensors: [
    { lane: 1, trig: "GPIO 5", echo: "GPIO 18" },
    { lane: 2, trig: "GPIO 19", echo: "GPIO 21" },
    { lane: 3, trig: "GPIO 22", echo: "GPIO 23" },
    { lane: 4, trig: "GPIO 25", echo: "GPIO 26" },
  ],
  leds: [
    { lane: 1, red: "GPIO 27", yellow: "GPIO 14", green: "GPIO 12" },
    { lane: 2, red: "GPIO 13", yellow: "GPIO 4", green: "GPIO 16" },
    { lane: 3, red: "GPIO 17", yellow: "GPIO 15", green: "GPIO 2" },
    { lane: 4, red: "GPIO 33", yellow: "GPIO 32", green: "GPIO 35" },
  ],
}

/** GET /api/system/status - health snapshot for the System Status page. */
export async function GET() {
  try {
    const { settings, lanes } = await getFullState()
    const now = Date.now()
    const esp32LastSeenMs = settings.esp32LastSeen ? new Date(settings.esp32LastSeen).getTime() : null

    return NextResponse.json({
      backend: "ONLINE",
      database: "FIREBASE",
      realtime: "POLLING", // 1s SWR polling - no persistent WebSocket on serverless hosting
      mode: settings.mode,
      esp32: {
        status: settings.mode === "esp32" && settings.esp32Connected ? "CONNECTED" : "DISCONNECTED",
        lastSeen: settings.esp32LastSeen,
        secondsSinceLastSeen: esp32LastSeenMs ? Math.round((now - esp32LastSeenMs) / 1000) : null,
      },
      lanes: lanes.map((l) => ({
        lane: l.laneNumber,
        sensor: l.sensorOnline ? "ONLINE" : "OFFLINE",
        lastUpdate: l.updatedAt,
      })),
      emergencyActive: settings.emergencyActive,
      lastUpdate: settings.lastTickAt,
      gpio: GPIO_CONFIG,
    })
  } catch (error) {
    console.error("[v0] /api/system/status error:", error)
    return NextResponse.json({ error: "Failed to load system status" }, { status: 500 })
  }
}
