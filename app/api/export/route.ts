import { NextResponse } from "next/server"
import { requireSession } from "@/lib/dal"
import { getExportablePrompt, getExportableCollection, getExportableLibrary } from "@/lib/queries/export"
import { toTxt, toMarkdown, toCsv, toJson } from "@/lib/export/generators"
import { generatePromptsPdf } from "@/lib/export/pdf"
import { EXPORT_FORMATS, type ExportFormat, type ExportScope } from "@/lib/export/types"
import type { ExportablePrompt } from "@/lib/export/types"

async function generate(format: ExportFormat, prompts: ExportablePrompt[]): Promise<Buffer | string> {
  switch (format) {
    case "txt":
      return toTxt(prompts)
    case "md":
      return toMarkdown(prompts)
    case "csv":
      return toCsv(prompts)
    case "json":
      return toJson(prompts)
    case "pdf":
      return generatePromptsPdf(prompts)
  }
}

export async function GET(request: Request) {
  const user = await requireSession()
  const { searchParams } = new URL(request.url)

  const scope = searchParams.get("scope") as ExportScope | null
  const id = searchParams.get("id")
  const format = searchParams.get("format") as ExportFormat | null
  const formatMeta = EXPORT_FORMATS.find((f) => f.value === format)

  if (!scope || !formatMeta) {
    return NextResponse.json({ error: "Missing or invalid scope/format" }, { status: 400 })
  }
  if ((scope === "prompt" || scope === "collection") && !id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  let prompts: ExportablePrompt[]
  switch (scope) {
    case "prompt":
      prompts = await getExportablePrompt(user.id, id!)
      break
    case "collection":
      prompts = await getExportableCollection(user.id, id!)
      break
    case "library":
      prompts = await getExportableLibrary(user.id)
      break
    default:
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 })
  }

  if (prompts.length === 0) {
    return NextResponse.json({ error: "Nothing to export" }, { status: 404 })
  }

  const content = await generate(formatMeta.value, prompts)
  const body = typeof content === "string" ? content : new Uint8Array(content)
  const filename = `${scope}-export-${new Date().toISOString().slice(0, 10)}.${formatMeta.extension}`

  return new NextResponse(body, {
    headers: {
      "Content-Type": formatMeta.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
