"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Library,
  Compass,
  Bot,
  FolderHeart,
  Star,
  Clock,
  TrendingUp,
  Wand2,
  Sparkles,
  FlaskConical,
  Radar,
  Sheet,
  HardDrive,
  BarChart3,
  Settings,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  comingSoon?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Prompt Library", href: "/prompts", icon: Library },
  { label: "Discover", href: "/discover", icon: Compass, comingSoon: true },
  { label: "Prompt Scout", href: "/prompt-scout", icon: Bot, comingSoon: true },
  { label: "Collections", href: "/collections", icon: FolderHeart },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "Recently Added", href: "/prompts?sort=recent", icon: Clock },
  { label: "Top Rated", href: "/prompts?sort=top-rated", icon: TrendingUp },
  { label: "Prompt Builder", href: "/prompt-builder", icon: Wand2, comingSoon: true },
  { label: "Prompt Improver", href: "/prompt-improver", icon: Sparkles, comingSoon: true },
  { label: "Prompt Tester", href: "/prompt-tester", icon: FlaskConical, comingSoon: true },
  { label: "Sources", href: "/sources", icon: Radar, comingSoon: true },
  { label: "Google Sheets", href: "/integrations/sheets", icon: Sheet, comingSoon: true },
  { label: "Google Drive", href: "/integrations/drive", icon: HardDrive, comingSoon: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, comingSoon: true },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex h-full w-60 flex-col gap-1 border-r bg-sidebar p-3 text-sidebar-foreground">
      <div className="mb-4 px-2 pt-2">
        <span className="text-base font-semibold tracking-tight">Prompt Library</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon

        if (item.comingSoon) {
          return (
            <div
              key={item.label}
              aria-disabled="true"
              title="Coming soon"
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {item.label}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Soon
              </span>
            </div>
          )
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
