import Link from "next/link"
import { notFound } from "next/navigation"
import { requireSession } from "@/lib/dal"
import { getCollectionById } from "@/lib/queries/collections"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteCollectionButton } from "@/components/collections/DeleteCollectionButton"
import { RemoveFromCollectionButton } from "@/components/collections/RemoveFromCollectionButton"
import { ExportMenu } from "@/components/export/ExportMenu"

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireSession()
  const collection = await getCollectionById(user.id, id)

  if (!collection) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{collection.name}</h1>
          {collection.description && (
            <p className="mt-1 text-muted-foreground">{collection.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu scope="collection" id={collection.id} />
          <DeleteCollectionButton collectionId={collection.id} />
        </div>
      </div>

      {collection.collection_prompts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No prompts in this collection yet. Add prompts from a prompt&apos;s detail page.
        </p>
      ) : (
        <div className="space-y-2">
          {collection.collection_prompts.map((cp: {
            prompt_id: string
            prompts: { id: string; title: string; description: string | null } | null
          }) => (
            <Card key={cp.prompt_id}>
              <CardContent className="flex items-center justify-between py-4">
                <Link href={`/prompts/${cp.prompt_id}`} className="min-w-0">
                  <div className="truncate font-medium hover:underline">{cp.prompts?.title}</div>
                  {cp.prompts?.description && (
                    <p className="truncate text-sm text-muted-foreground">
                      {cp.prompts.description}
                    </p>
                  )}
                </Link>
                <RemoveFromCollectionButton
                  collectionId={collection.id}
                  promptId={cp.prompt_id}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
