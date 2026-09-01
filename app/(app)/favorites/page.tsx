import { requireSession } from "@/lib/dal"
import { listPrompts } from "@/lib/queries/prompts"
import { PromptCard } from "@/components/prompts/PromptCard"

export default async function FavoritesPage() {
  const user = await requireSession()
  const { prompts } = await listPrompts({ userId: user.id, favoritesOnly: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>

      {prompts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t favorited any prompts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  )
}
