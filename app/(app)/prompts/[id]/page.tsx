import Link from "next/link"
import { notFound } from "next/navigation"
import { requireSession } from "@/lib/dal"
import { getPromptById, listPromptVersions } from "@/lib/queries/prompts"
import { listCollections } from "@/lib/queries/collections"
import { detectVariables } from "@/lib/variables"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { UsePromptDialog } from "@/components/prompts/UsePromptDialog"
import { AddToCollectionMenu } from "@/components/prompts/AddToCollectionMenu"
import { RatingStars } from "@/components/prompts/RatingStars"
import { CopyButton } from "@/components/prompts/CopyButton"
import { FavoriteButton } from "@/components/prompts/FavoriteButton"
import { ArchiveDeleteMenu } from "@/components/prompts/ArchiveDeleteMenu"
import { VersionHistory } from "@/components/prompts/VersionHistory"

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireSession()

  const [prompt, collections, versions] = await Promise.all([
    getPromptById(user.id, id),
    listCollections(user.id),
    listPromptVersions(id),
  ])

  if (!prompt) notFound()

  const variables = detectVariables(prompt.prompt_text)
  const tags =
    prompt.prompt_tags
      ?.map((pt: { tags: { name: string } | null }) => pt.tags?.name)
      .filter((name): name is string => Boolean(name)) ?? []
  const isFavorite = (prompt.favorites?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{prompt.title}</h1>
          {prompt.description && (
            <p className="mt-1 text-muted-foreground">{prompt.description}</p>
          )}
        </div>
        <FavoriteButton promptId={prompt.id} isFavorite={isFavorite} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {prompt.categories?.name && <Badge variant="secondary">{prompt.categories.name}</Badge>}
        {prompt.difficulty && <Badge variant="outline">{prompt.difficulty}</Badge>}
        {tags.map((tag: string) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
        {prompt.is_archived && <Badge variant="destructive">Archived</Badge>}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prompt</CardTitle>
          <CopyButton text={prompt.prompt_text} />
        </CardHeader>
        <CardContent>
          <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted/60 p-4 font-mono text-sm whitespace-pre-wrap">
            {prompt.prompt_text}
          </pre>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <UsePromptDialog promptText={prompt.prompt_text} variables={variables} />
        <Link
          href={`/prompts/${prompt.id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit
        </Link>
        <AddToCollectionMenu
          promptId={prompt.id}
          collections={collections.map((c) => ({
            id: c.id,
            name: c.name,
            promptIds:
              c.collection_prompts?.map((cp: { prompt_id: string }) => cp.prompt_id) ?? [],
          }))}
        />
        <Link
          href={`/prompt-improver?promptId=${prompt.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Improve with AI
        </Link>
        <Button variant="outline" disabled title="Ships in a later phase">
          Create variation
        </Button>
        <Link
          href={`/prompt-tester?promptId=${prompt.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Test prompt
        </Link>
        <ArchiveDeleteMenu promptId={prompt.id} isArchived={prompt.is_archived} />
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        {variables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variables</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <Badge key={v} variant="outline">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {(prompt.example_input || prompt.example_output) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {prompt.example_input && (
                <div>
                  <div className="mb-1 font-medium">Input</div>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {prompt.example_input}
                  </p>
                </div>
              )}
              {prompt.example_output && (
                <div>
                  <div className="mb-1 font-medium">Output</div>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {prompt.example_output}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {prompt.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">
              {prompt.instructions}
            </CardContent>
          </Card>
        )}

        {prompt.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">
              {prompt.notes}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your rating</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingStars promptId={prompt.id} rating={prompt.user_rating} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended models</CardTitle>
          </CardHeader>
          <CardContent>
            {prompt.recommended_models.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not specified.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {prompt.recommended_models.map((m: string) => (
                  <Badge key={m} variant="secondary">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version history</CardTitle>
        </CardHeader>
        <CardContent>
          <VersionHistory promptId={prompt.id} versions={versions} />
        </CardContent>
      </Card>
    </div>
  )
}
