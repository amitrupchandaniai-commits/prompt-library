import Link from "next/link"
import { requireSession } from "@/lib/dal"
import { listCollections } from "@/lib/queries/collections"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog"

export default async function CollectionsPage() {
  const user = await requireSession()
  const collections = await listCollections(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <NewCollectionDialog />
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t created any collections yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="h-full hover:bg-accent/50">
                <CardHeader>
                  <CardTitle className="text-base">{collection.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {collection.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {collection.collection_prompts?.length ?? 0} prompts
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
