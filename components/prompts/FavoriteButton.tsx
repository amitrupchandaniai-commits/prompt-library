"use client"

import { useTransition } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleFavorite } from "@/app/(app)/prompts/actions"

export function FavoriteButton({
  promptId,
  isFavorite,
}: {
  promptId: string
  isFavorite: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => toggleFavorite(promptId))}
    >
      <Star className={isFavorite ? "size-4 fill-amber-400 text-amber-400" : "size-4"} />
      {isFavorite ? "Favorited" : "Favorite"}
    </Button>
  )
}
