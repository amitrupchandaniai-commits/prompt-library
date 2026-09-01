"use client"

import { useTransition } from "react"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setPromptArchived, deletePrompt } from "@/app/(app)/prompts/actions"

export function ArchiveDeleteMenu({
  promptId,
  isArchived,
}: {
  promptId: string
  isArchived: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" disabled={isPending} aria-label="More actions" />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            startTransition(async () => {
              await setPromptArchived(promptId, !isArchived)
              toast.success(isArchived ? "Prompt unarchived" : "Prompt archived")
            })
          }
        >
          {isArchived ? "Unarchive" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (confirm("Delete this prompt permanently? This cannot be undone.")) {
              startTransition(() => deletePrompt(promptId))
            }
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
