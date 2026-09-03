import "server-only"
import type { sheets_v4 } from "@googleapis/sheets"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { SHEET_NAMES, NEW_DISCOVERIES_HEADERS, WEEKLY_REPORTS_HEADERS, SOURCES_HEADERS, AGENT_ACTIVITY_HEADERS, TRENDS_HEADERS } from "./sheets-schema"

const SPREADSHEET_TITLE = "Prompt Library — AI Research"

const ALL_SHEETS: { name: string; headers: readonly string[] }[] = [
  { name: SHEET_NAMES.newDiscoveries, headers: NEW_DISCOVERIES_HEADERS },
  { name: SHEET_NAMES.approvedPrompts, headers: NEW_DISCOVERIES_HEADERS },
  { name: SHEET_NAMES.rejectedPrompts, headers: NEW_DISCOVERIES_HEADERS },
  { name: SHEET_NAMES.weeklyReports, headers: WEEKLY_REPORTS_HEADERS },
  { name: SHEET_NAMES.sources, headers: SOURCES_HEADERS },
  { name: SHEET_NAMES.agentActivity, headers: AGENT_ACTIVITY_HEADERS },
  { name: SHEET_NAMES.trends, headers: TRENDS_HEADERS },
]

/**
 * Creates the "Prompt Library — AI Research" spreadsheet (all 7 worksheets,
 * header rows written) on first use, or verifies a previously-created one is
 * still reachable — falling through to create-new if it was deleted out of
 * band. Persists the (possibly new) spreadsheet id back onto google_integrations.
 */
export async function ensureSpreadsheet(
  sheetsClient: sheets_v4.Sheets,
  supabase: SupabaseClient<Database>,
  userId: string,
  existingSpreadsheetId: string | null
): Promise<string> {
  if (existingSpreadsheetId) {
    try {
      await sheetsClient.spreadsheets.get({ spreadsheetId: existingSpreadsheetId })
      return existingSpreadsheetId
    } catch {
      // Deleted or inaccessible out of band — fall through to create a new one.
    }
  }

  const { data } = await sheetsClient.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_TITLE },
      sheets: ALL_SHEETS.map((sheet) => ({ properties: { title: sheet.name } })),
    },
  })

  const spreadsheetId = data.spreadsheetId
  if (!spreadsheetId) throw new Error("Google did not return a spreadsheet id")

  for (const sheet of ALL_SHEETS) {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheet.name}'!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...sheet.headers]] },
    })
  }

  await supabase
    .from("google_integrations")
    .update({ spreadsheet_id: spreadsheetId, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  return spreadsheetId
}

/**
 * Upserts rows into `sheetName` keyed by column A: existing keys are updated
 * in place, new keys are appended. Returns the full key -> 1-based row number
 * map so callers can persist google_sheet_row_id for fast future lookups.
 */
export async function upsertRowsByKey(
  sheetsClient: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  headers: readonly string[],
  rows: { key: string; values: string[] }[]
): Promise<Map<string, number>> {
  const { data } = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A2:A`,
  })

  const keyToRow = new Map<string, number>()
  ;(data.values ?? []).forEach((row, index) => {
    const key = row[0]
    if (key) keyToRow.set(key, index + 2) // +2: header row + 1-based index
  })

  const lastColumn = columnLetter(headers.length)
  let nextAppendRow = keyToRow.size > 0 ? Math.max(...keyToRow.values()) + 1 : 2

  for (const row of rows) {
    const existingRowNumber = keyToRow.get(row.key)
    if (existingRowNumber) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A${existingRowNumber}:${lastColumn}${existingRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row.values] },
      })
    } else {
      const rowNumber = nextAppendRow
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A${rowNumber}:${lastColumn}${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row.values] },
      })
      keyToRow.set(row.key, rowNumber)
      nextAppendRow += 1
    }
  }

  return keyToRow
}

function columnLetter(count: number): string {
  let n = count
  let letters = ""
  while (n > 0) {
    const remainder = (n - 1) % 26
    letters = String.fromCharCode(65 + remainder) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}
