import { signOut } from "@/app/(auth)/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SearchCommand } from "@/components/layout/SearchCommand"
import type { PromptListItem } from "@/lib/queries/prompts"

export function TopBar({
  displayName,
  email,
  searchablePrompts,
}: {
  displayName: string | null
  email: string
  searchablePrompts: Pick<PromptListItem, "id" | "title" | "description">[]
}) {
  const initial = (displayName || email).charAt(0).toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <SearchCommand prompts={searchablePrompts} />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
          <Avatar className="size-7">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{displayName || email}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<a href="/settings" />}>Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
