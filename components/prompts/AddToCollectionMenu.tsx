"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addPromptToCollection, removePromptFromCollection } from "@/app/(app)/collections/actions"

type Collection = { id: string; name: string; promptIds: string[] }

export function AddToCollectionMenu({
  promptId,
  collections,
}: {
  promptId: string
  collections: Collection[]
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" disabled={isPending} />}>
        Add to collection
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Collections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {collections.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No collections yet — create one first.
          </p>
        )}
        {collections.map((collection) => {
          const isIn = collection.promptIds.includes(promptId)
          return (
            <DropdownMenuCheckboxItem
              key={collection.id}
              checked={isIn}
              onCheckedChange={(checked) => {
                startTransition(async () => {
                  if (checked) {
                    await addPromptToCollection(collection.id, promptId)
                  } else {
                    await removePromptFromCollection(collection.id, promptId)
                  }
                  toast.success(
                    checked ? `Added to ${collection.name}` : `Removed from ${collection.name}`
                  )
                })
              }}
            >
              {collection.name}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
