import {
  Activity,
  BarChart3,
  Cpu,
  FileCode,
  History,
  Info,
  LayoutDashboard,
  Radar,
  Settings,
  Siren,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Live Traffic", href: "/live-traffic", icon: Radar },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Signal History", href: "/history", icon: History },
  { label: "Emergency", href: "/emergency", icon: Siren },
  { label: "System Status", href: "/system-status", icon: Activity },
  { label: "Hardware", href: "/hardware", icon: Cpu },
  { label: "Settings", href: "/settings", icon: Settings },
]

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "About Project", href: "/about", icon: Info },
  { label: "API Docs", href: "/api-docs", icon: FileCode },
]
