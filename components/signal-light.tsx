import { cn } from "@/lib/utils"
import type { Signal } from "@/lib/traffic/types"

const ORDER: Signal[] = ["RED", "YELLOW", "GREEN"]

const ACTIVE_CLASS: Record<Signal, string> = {
  RED: "bg-signal-red shadow-[0_0_12px_2px_var(--signal-red)]",
  YELLOW: "bg-signal-yellow shadow-[0_0_12px_2px_var(--signal-yellow)]",
  GREEN: "bg-signal-green shadow-[0_0_12px_2px_var(--signal-green)]",
}

const DIM_CLASS: Record<Signal, string> = {
  RED: "bg-signal-red-dim",
  YELLOW: "bg-signal-yellow-dim",
  GREEN: "bg-signal-green-dim",
}

export function SignalLight({
  active,
  size = "md",
}: {
  active: Signal
  size?: "sm" | "md"
}) {
  const dim = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"
  return (
    <div className="flex flex-col gap-1 rounded-full bg-black/40 p-1.5" role="img" aria-label={`Signal ${active}`}>
      {ORDER.map((color) => (
        <div
          key={color}
          className={cn("rounded-full transition-all", dim, color === active ? ACTIVE_CLASS[color] : DIM_CLASS[color])}
        />
      ))}
    </div>
  )
}
