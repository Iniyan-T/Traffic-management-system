import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, Gauge, Radar, Siren, TrafficCone } from "lucide-react"

const FEATURES = [
  {
    icon: Radar,
    title: "Ultrasonic Sensing",
    body: "4x HC-SR04 ultrasonic distance sensors continuously measure vehicle queue length on each lane approach.",
  },
  {
    icon: Gauge,
    title: "Priority Scoring",
    body: "Each lane gets a live priority score from density and waiting time, weighted and re-computed every tick.",
  },
  {
    icon: TrafficCone,
    title: "Adaptive Signal Timing",
    body: "Green duration scales with density instead of using a fixed timer, so busier lanes get proportionally more time.",
  },
  {
    icon: Siren,
    title: "Emergency Override",
    body: "An operator or automated trigger can force an immediate green for any lane, holding it for a configurable duration.",
  },
  {
    icon: Cpu,
    title: "ESP32 Hardware Mode",
    body: "Swap the simulator for a real ESP32 + sensor rig at any time; the same engine and dashboard just start consuming live readings.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">About This Project</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This is an adaptive traffic management system for a 4-lane intersection. Instead of fixed-duration
          signal cycles, it continuously measures vehicle density with ultrasonic sensors and computes a
          priority score per lane, then allocates green time to the lane that needs it most &mdash; while
          guaranteeing every lane is eventually served.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
              <f.icon className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">{f.body}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Stack</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          Next.js App Router, Neon Postgres with Drizzle ORM for lane state and history, and a 1-second SWR
          polling loop for live updates on every page.
        </CardContent>
      </Card>
    </div>
  )
}
