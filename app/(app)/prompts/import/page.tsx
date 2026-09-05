import { requireSession } from "@/lib/dal"
import { ImportForm } from "@/components/export/ImportForm"

export default async function ImportPromptsPage() {
  await requireSession()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import prompts</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a <code>.json</code>, <code>.csv</code>, or <code>.txt</code> file. JSON round-trips
          everything an export produces; CSV imports one prompt per row; a TXT file becomes a
          single new prompt.
        </p>
      </div>
      <ImportForm />
    </div>
  )
}
