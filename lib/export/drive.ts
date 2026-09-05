import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { getGoogleClients } from "@/lib/google/client"
import { ensureFolderStructure, uploadFile } from "@/lib/google/drive"
import { getExportablePrompt, getExportableCollection, getExportableLibrary } from "@/lib/queries/export"
import { toTxt, toMarkdown, toCsv, toJson } from "./generators"
import { generatePromptsPdf } from "./pdf"
import { EXPORT_FORMATS, type ExportFormat, type ExportScope, type ExportablePrompt } from "./types"

async function generate(format: ExportFormat, prompts: ExportablePrompt[]): Promise<Buffer> {
  switch (format) {
    case "txt":
      return Buffer.from(toTxt(prompts), "utf8")
    case "md":
      return Buffer.from(toMarkdown(prompts), "utf8")
    case "csv":
      return Buffer.from(toCsv(prompts), "utf8")
    case "json":
      return Buffer.from(toJson(prompts), "utf8")
    case "pdf":
      return generatePromptsPdf(prompts)
  }
}

/** Generates the export and uploads it to the connected account's "Prompt Exports" Drive folder. */
export async function exportToDrive(
  supabase: SupabaseClient<Database>,
  userId: string,
  scope: ExportScope,
  id: string | null,
  format: ExportFormat
): Promise<{ fileId: string; webViewLink: string | null }> {
  const formatMeta = EXPORT_FORMATS.find((f) => f.value === format)
  if (!formatMeta) throw new Error("Invalid export format")

  let prompts: ExportablePrompt[]
  if (scope === "prompt") {
    if (!id) throw new Error("Missing id")
    prompts = await getExportablePrompt(userId, id)
  } else if (scope === "collection") {
    if (!id) throw new Error("Missing id")
    prompts = await getExportableCollection(userId, id)
  } else {
    prompts = await getExportableLibrary(userId)
  }

  if (prompts.length === 0) throw new Error("Nothing to export")

  const { data: integration } = await supabase
    .from("google_integrations")
    .select("drive_root_folder_id, drive_subfolder_ids")
    .eq("user_id", userId)
    .single()

  const { drive: driveClient } = await getGoogleClients(supabase, userId)
  const { subfolders } = await ensureFolderStructure(driveClient, supabase, userId, {
    rootId: integration?.drive_root_folder_id ?? null,
    subfolders: (integration?.drive_subfolder_ids as Record<string, string>) ?? {},
  })

  const content = await generate(formatMeta.value, prompts)
  const filename = `${scope}-export-${new Date().toISOString().slice(0, 10)}.${formatMeta.extension}`

  return uploadFile(driveClient, subfolders["Prompt Exports"], filename, formatMeta.mimeType, content)
}
