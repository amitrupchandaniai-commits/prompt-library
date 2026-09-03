import Link from "next/link"
import { requireSession } from "@/lib/dal"
import { listPrompts, listCategories, searchPromptsSemantic } from "@/lib/queries/prompts"
import { PromptCard } from "@/components/prompts/PromptCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  const categoryId = category && category !== "all" ? category : undefined
  const trimmedQuery = q?.trim()

  const categories = await listCategories()

  let prompts: Awaited<ReturnType<typeof listPrompts>>["prompts"] = []
  let usedSemanticSearch = false

  if (trimmedQuery) {
    try {
      const result = await searchPromptsSemantic({ userId: user.id, query: trimmedQuery, categoryId })
      prompts = result.prompts
      usedSemanticSearch = true
    } catch {
      // No OPENAI_API_KEY, or the embedding call failed — degrade to keyword search
      // rather than break the page.
      const result = await listPrompts({ userId: user.id, search: trimmedQuery, categoryId })
      prompts = result.prompts
    }
  } else {
    const result = await listPrompts({ userId: user.id, categoryId })
    prompts = result.prompts
  }

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

      <form className="flex flex-wrap items-center gap-2" action="/prompts">
        <Input
          name="q"
          placeholder="Search your prompt intelligence… (try a full sentence)"
          defaultValue={q}
          className="max-w-sm"
        />
        <Select
          name="category"
          items={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          defaultValue={category ?? "all"}
        >
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
          Search
        </Button>
        {usedSemanticSearch && <Badge variant="outline">Semantic search</Badge>}
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
