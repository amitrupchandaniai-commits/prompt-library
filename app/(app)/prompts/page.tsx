import Link from "next/link"
import { requireSession } from "@/lib/dal"
import { listPrompts, listCategories } from "@/lib/queries/prompts"
import { PromptCard } from "@/components/prompts/PromptCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}) {
  const { q, category, sort } = await searchParams
  const user = await requireSession()

  const [{ prompts }, categories] = await Promise.all([
    listPrompts({ userId: user.id, search: q, categoryId: category }),
    listCategories(),
  ])

  const sorted = [...prompts]
  if (sort === "top-rated") {
    sorted.sort((a, b) => (b.user_rating ?? 0) - (a.user_rating ?? 0))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Prompt Library</h1>
        <Link href="/prompts/new" className={buttonVariants()}>
          New prompt
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action="/prompts">
        <Input
          name="q"
          placeholder="Search title, description, prompt text…"
          defaultValue={q}
          className="max-w-sm"
        />
        <Select name="category" defaultValue={category ?? "all"}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No prompts match your filters yet.{" "}
          <Link href="/prompts/new" className="underline underline-offset-4">
            Create one
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  )
}
