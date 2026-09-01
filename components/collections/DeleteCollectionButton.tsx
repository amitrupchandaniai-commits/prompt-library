"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteCollection } from "@/app/(app)/collections/actions"

export function DeleteCollectionButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (confirm("Delete this collection? Prompts inside it are not deleted.")) {
          startTransition(() => deleteCollection(collectionId))
        }
      }}
    >
      Delete collection
    </Button>
  )
}
