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
  Sparkle,
  ShieldCheck,
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
  { label: "Prompt Builder", href: "/prompt-builder", icon: Wand2 },
  { label: "Prompt Improver", href: "/prompt-improver", icon: Sparkles },
  { label: "Prompt Scout", href: "/prompt-scout", icon: Bot },
  { label: "Sources", href: "/sources", icon: Radar },
  { label: "Collections", href: "/collections", icon: FolderHeart },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "Recently Added", href: "/prompts?sort=recent", icon: Clock },
  { label: "Top Rated", href: "/prompts?sort=top-rated", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
]

const COMING_SOON_ITEMS: NavItem[] = [
  { label: "Discover", href: "/discover", icon: Compass, comingSoon: true },
  { label: "Prompt Tester", href: "/prompt-tester", icon: FlaskConical, comingSoon: true },
  { label: "Google Sheets", href: "/integrations/sheets", icon: Sheet, comingSoon: true },
  { label: "Google Drive", href: "/integrations/drive", icon: HardDrive, comingSoon: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, comingSoon: true },
]

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md py-1.5 pr-3 pl-3.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary opacity-0 transition-opacity",
          isActive && "opacity-100"
        )}
      />
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const items = isAdmin
    ? [...NAV_ITEMS, { label: "Admin", href: "/admin", icon: ShieldCheck }]
    : NAV_ITEMS

  return (
    <nav className="flex h-full w-60 flex-col gap-0.5 overflow-y-auto border-r bg-sidebar p-3 text-sidebar-foreground">
      <div className="mb-5 flex items-center gap-2 px-1.5 pt-1.5">
        <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Sparkle className="size-3.5" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Prompt Library</span>
      </div>

      {items.map((item) => (
        <NavLink
          key={item.label}
          item={item}
          isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
        />
      ))}

      <div className="mt-5 mb-1.5 px-3.5 text-[11px] font-medium tracking-wide text-sidebar-foreground/40 uppercase">
        Coming soon
      </div>

      {COMING_SOON_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            aria-disabled="true"
            title="Coming soon"
            className="flex items-center gap-2.5 rounded-md py-1.5 pr-3 pl-3.5 text-sm text-sidebar-foreground/35"
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </div>
        )
      })}
    </nav>
  )
}
