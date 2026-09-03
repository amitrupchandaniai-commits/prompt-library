import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/types/database.types"
import { getGoogleClients } from "./client"
import { ensureSpreadsheet, upsertRowsByKey } from "./sheets"
import { ensureFolderStructure, uploadFile, type DriveSubfolder } from "./drive"
import { generateWeeklyReportPdf } from "./report-pdf"
import {
  SHEET_NAMES,
  NEW_DISCOVERIES_HEADERS,
  WEEKLY_REPORTS_HEADERS,
  SOURCES_HEADERS,
  AGENT_ACTIVITY_HEADERS,
  candidateToNewDiscoveriesRow,
  runToWeeklyReportsRow,
  sourceToRow,
  runToActivityRows,
} from "./sheets-schema"

type ResearchCandidateRow = Database["public"]["Tables"]["research_candidates"]["Row"]

async function appendRunError(
  supabase: SupabaseClient<Database>,
  runId: string,
  message: string
): Promise<void> {
  const { data: run } = await supabase.from("research_runs").select("errors").eq("id", runId).single()
  const errors = Array.isArray(run?.errors) ? (run.errors as Json[]) : []
  await supabase
    .from("research_runs")
    .update({ errors: [...errors, message] })
    .eq("id", runId)
}

async function loadCandidateRows(
  supabase: SupabaseClient<Database>,
  candidates: ResearchCandidateRow[]
): Promise<{ key: string; values: string[] }[]> {
  const categoryIds = [...new Set(candidates.map((c) => c.category_id).filter(Boolean))] as string[]
  const categoryNameById = new Map<string, string>()
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase.from("categories").select("id, name").in("id", categoryIds)
    for (const c of categories ?? []) categoryNameById.set(c.id, c.name)
  }

  return candidates.map((candidate) => ({
    key: candidate.id,
    values: candidateToNewDiscoveriesRow(
      candidate,
      candidate.category_id ? (categoryNameById.get(candidate.category_id) ?? null) : null
    ),
  }))
}

async function syncSheets(
  supabase: SupabaseClient<Database>,
  userId: string,
  runId: string
): Promise<void> {
  const { data: integration } = await supabase
    .from("google_integrations")
    .select("spreadsheet_id")
    .eq("user_id", userId)
    .single()

  const { sheets: sheetsClient } = await getGoogleClients(supabase, userId)
  const spreadsheetId = await ensureSpreadsheet(sheetsClient, supabase, userId, integration?.spreadsheet_id ?? null)

  const { data: run } = await supabase.from("research_runs").select("*").eq("id", runId).single()
  if (!run) throw new Error("Run not found")

  const { data: candidates } = await supabase.from("research_candidates").select("*").eq("run_id", runId)
  const allCandidateRows = await loadCandidateRows(supabase, candidates ?? [])

  const rowMap = await upsertRowsByKey(
    sheetsClient,
    spreadsheetId,
    SHEET_NAMES.newDiscoveries,
    NEW_DISCOVERIES_HEADERS,
    allCandidateRows
  )

  for (const [candidateId, rowNumber] of rowMap) {
    await supabase
      .from("research_candidates")
      .update({ google_sheet_row_id: rowNumber })
      .eq("id", candidateId)
  }

  const approvedRows = allCandidateRows.filter((_, i) => candidates?.[i]?.review_status === "approved")
  const rejectedRows = allCandidateRows.filter((_, i) => candidates?.[i]?.review_status === "rejected")
  if (approvedRows.length > 0) {
    await upsertRowsByKey(sheetsClient, spreadsheetId, SHEET_NAMES.approvedPrompts, NEW_DISCOVERIES_HEADERS, approvedRows)
  }
  if (rejectedRows.length > 0) {
    await upsertRowsByKey(sheetsClient, spreadsheetId, SHEET_NAMES.rejectedPrompts, NEW_DISCOVERIES_HEADERS, rejectedRows)
  }

  await upsertRowsByKey(sheetsClient, spreadsheetId, SHEET_NAMES.weeklyReports, WEEKLY_REPORTS_HEADERS, [
    { key: run.id, values: runToWeeklyReportsRow(run, null) },
  ])

  const { data: sources } = await supabase.from("sources").select("*")
  if (sources && sources.length > 0) {
    await upsertRowsByKey(
      sheetsClient,
      spreadsheetId,
      SHEET_NAMES.sources,
      SOURCES_HEADERS,
      sources.map((source) => ({ key: source.id, values: sourceToRow(source) }))
    )
  }

  const activityRows = runToActivityRows(run)
  await upsertRowsByKey(
    sheetsClient,
    spreadsheetId,
    SHEET_NAMES.agentActivity,
    AGENT_ACTIVITY_HEADERS,
    activityRows.map((values, i) => ({ key: `${run.id}-${i}`, values }))
  )
}

async function syncDrive(
  supabase: SupabaseClient<Database>,
  userId: string,
  runId: string
): Promise<void> {
  const { data: integration } = await supabase
    .from("google_integrations")
    .select("drive_root_folder_id, drive_subfolder_ids")
    .eq("user_id", userId)
    .single()

  const { drive: driveClient } = await getGoogleClients(supabase, userId)
  const { subfolders } = await ensureFolderStructure(driveClient, supabase, userId, {
    rootId: integration?.drive_root_folder_id ?? null,
    subfolders: (integration?.drive_subfolder_ids as Partial<Record<DriveSubfolder, string>>) ?? {},
  })

  const { data: run } = await supabase.from("research_runs").select("*").eq("id", runId).single()
  if (!run) throw new Error("Run not found")
  const { data: candidates } = await supabase.from("research_candidates").select("*").eq("run_id", runId)

  const pdf = await generateWeeklyReportPdf(run, candidates ?? [])
  const filename = `Prompt_Scout_Weekly_Report_${run.started_at.slice(0, 10)}.pdf`
  const { fileId } = await uploadFile(driveClient, subfolders["Weekly Reports"], filename, "application/pdf", pdf)

  await supabase
    .from("research_runs")
    .update({
      drive_report_status: "uploaded",
      drive_report_error: null,
      drive_report_file_id: fileId,
      drive_report_uploaded_at: new Date().toISOString(),
    })
    .eq("id", runId)
}

/**
 * Best-effort: never throws. Callers (lib/scout/pipeline.ts, the retry job)
 * rely on this to never fail the parent Prompt Scout run
 * (docs/GOOGLE_INTEGRATION.md §6) — each half records its own status/error on
 * the run row and appends to research_runs.errors.
 */
export async function syncRunToGoogle(
  supabase: SupabaseClient<Database>,
  userId: string,
  runId: string,
  opts: { skipSheets?: boolean; skipDrive?: boolean } = {}
): Promise<void> {
  const { data: integration } = await supabase
    .from("google_integrations")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (!integration) return

  if (!opts.skipSheets) {
    try {
      await syncSheets(supabase, userId, runId)
      await supabase
        .from("research_runs")
        .update({
          sheets_sync_status: "synced",
          sheets_sync_error: null,
          sheets_synced_at: new Date().toISOString(),
        })
        .eq("id", runId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Sheets sync error"
      await supabase.from("research_runs").update({ sheets_sync_status: "failed", sheets_sync_error: message }).eq("id", runId)
      await appendRunError(supabase, runId, `Sheets sync failed: ${message}`)
    }
  }

  if (!opts.skipDrive) {
    try {
      await syncDrive(supabase, userId, runId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Drive upload error"
      await supabase.from("research_runs").update({ drive_report_status: "failed", drive_report_error: message }).eq("id", runId)
      await appendRunError(supabase, runId, `Drive upload failed: ${message}`)
    }
  }
}

/** Single-row incremental sync, used after an approve/reject action. */
export async function syncCandidateToSheets(
  supabase: SupabaseClient<Database>,
  userId: string,
  candidateId: string
): Promise<void> {
  const { data: integration } = await supabase
    .from("google_integrations")
    .select("spreadsheet_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (!integration?.spreadsheet_id) return

  const { data: candidate } = await supabase
    .from("research_candidates")
    .select("*")
    .eq("id", candidateId)
    .single()
  if (!candidate) return

  const { sheets: sheetsClient } = await getGoogleClients(supabase, userId)
  const [row] = await loadCandidateRows(supabase, [candidate])
  await upsertRowsByKey(sheetsClient, integration.spreadsheet_id, SHEET_NAMES.newDiscoveries, NEW_DISCOVERIES_HEADERS, [row])

  if (candidate.review_status === "approved" || candidate.review_status === "rejected") {
    const targetSheet = candidate.review_status === "approved" ? SHEET_NAMES.approvedPrompts : SHEET_NAMES.rejectedPrompts
    await upsertRowsByKey(sheetsClient, integration.spreadsheet_id, targetSheet, NEW_DISCOVERIES_HEADERS, [row])
  }
}
