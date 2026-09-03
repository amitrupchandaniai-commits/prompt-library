import "server-only"
import { Readable } from "node:stream"
import type { drive_v3 } from "@googleapis/drive"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

const ROOT_FOLDER_NAME = "Prompt Library"

export const DRIVE_SUBFOLDERS = [
  "Weekly Reports",
  "Prompt Exports",
  "Research",
  "Backups",
  "Documentation",
] as const
export type DriveSubfolder = (typeof DRIVE_SUBFOLDERS)[number]

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"

async function findOrCreateFolder(
  driveClient: drive_v3.Drive,
  name: string,
  parentId: string | null
): Promise<string> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : ""
  const { data } = await driveClient.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false${parentClause}`,
    fields: "files(id)",
    spaces: "drive",
  })

  const existing = data.files?.[0]?.id
  if (existing) return existing

  const { data: created } = await driveClient.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  })

  if (!created.id) throw new Error(`Could not create Drive folder "${name}"`)
  return created.id
}

/**
 * Ensures the "Prompt Library" root folder and its subfolders exist, creating
 * only what's missing. Safe to call repeatedly: drive.file scope means the
 * app only ever sees folders it created itself, so a name search before
 * create can't collide with an unrelated folder and won't double-create on a
 * retry after a partial failure.
 */
export async function ensureFolderStructure(
  driveClient: drive_v3.Drive,
  supabase: SupabaseClient<Database>,
  userId: string,
  existing: { rootId: string | null; subfolders: Partial<Record<DriveSubfolder, string>> }
): Promise<{ rootId: string; subfolders: Record<DriveSubfolder, string> }> {
  const rootId = existing.rootId ?? (await findOrCreateFolder(driveClient, ROOT_FOLDER_NAME, null))

  const subfolders = {} as Record<DriveSubfolder, string>
  for (const name of DRIVE_SUBFOLDERS) {
    subfolders[name] = existing.subfolders[name] ?? (await findOrCreateFolder(driveClient, name, rootId))
  }

  await supabase
    .from("google_integrations")
    .update({
      drive_root_folder_id: rootId,
      drive_subfolder_ids: subfolders,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  return { rootId, subfolders }
}

export async function uploadFile(
  driveClient: drive_v3.Drive,
  folderId: string,
  filename: string,
  mimeType: string,
  content: Buffer
): Promise<{ fileId: string; webViewLink: string | null }> {
  const { data } = await driveClient.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: Readable.from(content) },
    fields: "id, webViewLink",
  })

  if (!data.id) throw new Error(`Could not upload "${filename}" to Drive`)
  return { fileId: data.id, webViewLink: data.webViewLink ?? null }
}
