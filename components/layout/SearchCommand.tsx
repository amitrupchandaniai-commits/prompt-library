"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { PromptListItem } from "@/lib/queries/prompts"

export function SearchCommand({
  prompts,
}: {
  prompts: Pick<PromptListItem, "id" | "title" | "description">[]
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-72 items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-4" />
        Search your prompt intelligence...
        <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search prompts..." />
        <CommandList>
          <CommandEmpty>No prompts found.</CommandEmpty>
          <CommandGroup heading="Prompts">
            {prompts.map((prompt) => (
              <CommandItem
                key={prompt.id}
                value={prompt.title}
                onSelect={() => {
                  setOpen(false)
                  router.push(`/prompts/${prompt.id}`)
                }}
              >
                {prompt.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
