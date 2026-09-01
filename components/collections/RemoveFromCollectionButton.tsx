"use client"

import { useTransition } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removePromptFromCollection } from "@/app/(app)/collections/actions"

export function RemoveFromCollectionButton({
  collectionId,
  promptId,
}: {
  collectionId: string
  promptId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      aria-label="Remove from collection"
      onClick={() => startTransition(() => removePromptFromCollection(collectionId, promptId))}
    >
      <X className="size-4" />
    </Button>
  )
}
