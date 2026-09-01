"use client"

import { useTransition } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { ratePrompt } from "@/app/(app)/prompts/actions"

export function RatingStars({ promptId, rating }: { promptId: string; rating: number | null }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={isPending}
          aria-label={`Rate ${value} out of 5`}
          onClick={() => startTransition(() => ratePrompt(promptId, value))}
        >
          <Star
            className={cn(
              "size-5 text-muted-foreground/40 transition-colors hover:text-amber-400",
              rating && value <= rating && "fill-amber-400 text-amber-400"
            )}
          />
        </button>
      ))}
    </div>
  )
}
