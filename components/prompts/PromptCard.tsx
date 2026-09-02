"use client"

import Link from "next/link"
import { Star, Copy } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { toggleFavorite } from "@/app/(app)/prompts/actions"
import type { PromptListItem } from "@/lib/queries/prompts"

export function PromptCard({ prompt }: { prompt: PromptListItem }) {
  const isFavorite = (prompt.is_favorite?.length ?? 0) > 0
  const tags = prompt.prompt_tags?.map((pt) => pt.tags?.name).filter(Boolean) ?? []

  return (
    <Card className="flex flex-col gap-3 py-4 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <Link href={`/prompts/${prompt.id}`} className="min-w-0">
          <h3 className="truncate font-medium hover:underline">{prompt.title}</h3>
        </Link>
        <form
          action={async () => {
            await toggleFavorite(prompt.id)
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={isFavorite ? "size-4 fill-amber-400 text-amber-400" : "size-4"} />
          </Button>
        </form>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {prompt.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{prompt.description}</p>
        ) : (
          <p className="line-clamp-2 rounded-md bg-muted/60 px-2 py-1.5 font-mono text-xs text-muted-foreground">
            {prompt.prompt_text}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {prompt.categories?.name && (
            <Badge variant="secondary">{prompt.categories.name}</Badge>
          )}
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={async (e) => {
              e.preventDefault()
              await navigator.clipboard.writeText(prompt.prompt_text)
              toast.success("Prompt copied to clipboard")
            }}
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
          <Link
            href={`/prompts/${prompt.id}`}
            className={buttonVariants({ size: "sm", variant: "secondary" })}
          >
            Open
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
