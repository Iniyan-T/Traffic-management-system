"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Save, RotateCcw, Play, Pause } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface SettingsData {
  densityWeight: number
  waitingWeight: number
  baseGreenTime: number
  greenMultiplier: number
  yellowDuration: number
  allRedDuration: number
  maxWaitingTime: number
  emergencyDuration: number
  mode: string
  simulationRunning: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const FIELDS: { key: keyof SettingsData; label: string; min: number; max: number; suffix: string }[] = [
  { key: "densityWeight", label: "Density Weight", min: 1, max: 20, suffix: "x" },
  { key: "waitingWeight", label: "Waiting Time Weight", min: 0, max: 5, suffix: "x" },
  { key: "baseGreenTime", label: "Base Green Time", min: 1, max: 10, suffix: "s" },
  { key: "greenMultiplier", label: "Green Duration Multiplier", min: 1, max: 5, suffix: "x" },
  { key: "yellowDuration", label: "Yellow Duration", min: 1, max: 5, suffix: "s" },
  { key: "allRedDuration", label: "All-Red Clearance", min: 0, max: 3, suffix: "s" },
  { key: "maxWaitingTime", label: "Max Waiting Time Alert", min: 10, max: 120, suffix: "s" },
  { key: "emergencyDuration", label: "Emergency Override Duration", min: 5, max: 30, suffix: "s" },
]

export function SettingsView() {
  const { data, mutate } = useSWR<SettingsData>("/api/settings", fetcher)
  const [form, setForm] = useState<SettingsData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data && !form) setForm(data)
  }, [data, form])

  async function save() {
    if (!form) return
    setSaving(true)
    setSaved(false)
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    await mutate(updated)
    setForm(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function reset() {
    setSaving(true)
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    })
    const updated = await res.json()
    await mutate(updated)
    setForm(updated)
    setSaving(false)
  }

  async function toggleSimulation() {
    if (!form) return
    const next = { ...form, simulationRunning: !form.simulationRunning }
    setForm(next)
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulationRunning: next.simulationRunning }),
    })
    const updated = await res.json()
    await mutate(updated)
    setForm(updated)
  }

  if (!form) {
    return <div className="p-4 md:p-8 text-sm text-muted-foreground">Loading settings…</div>
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune the priority algorithm and control the simulation engine.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Simulation Control</CardTitle>
          <CardDescription>
            Currently running in {form.mode === "esp32" ? "hardware (ESP32)" : "simulation"} mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {form.simulationRunning ? (
              <Play className="h-4 w-4 text-signal-green" />
            ) : (
              <Pause className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="sim-toggle" className="text-sm">
              {form.simulationRunning ? "Simulation running" : "Simulation paused"}
            </Label>
          </div>
          <Switch id="sim-toggle" checked={form.simulationRunning} onCheckedChange={toggleSimulation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Priority Algorithm</CardTitle>
          <CardDescription>
            Priority = (density score x weight) + (waiting time x weight). Green duration = base + density x
            multiplier.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{field.label}</Label>
                <span className="font-mono text-sm text-muted-foreground">
                  {form[field.key]}
                  {field.suffix}
                </span>
              </div>
              <Slider
                value={[form[field.key] as number]}
                min={field.min}
                max={field.max}
                step={1}
                onValueChange={(value) =>
                  setForm({ ...form, [field.key]: Array.isArray(value) ? value[0] : value })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={reset} disabled={saving} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saved ? "Saved" : saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
