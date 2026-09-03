import { describe, expect, it } from "vitest"
import type { Database } from "@/types/database.types"
import {
  NEW_DISCOVERIES_HEADERS,
  WEEKLY_REPORTS_HEADERS,
  SOURCES_HEADERS,
  AGENT_ACTIVITY_HEADERS,
  candidateToNewDiscoveriesRow,
  runToWeeklyReportsRow,
  sourceToRow,
  runToActivityRows,
} from "@/lib/google/sheets-schema"

type ResearchCandidateRow = Database["public"]["Tables"]["research_candidates"]["Row"]
type ResearchRunRow = Database["public"]["Tables"]["research_runs"]["Row"]
type SourceRow = Database["public"]["Tables"]["sources"]["Row"]

const candidate: ResearchCandidateRow = {
  id: "c1",
  run_id: "r1",
  title: "Test candidate",
  description: "A description",
  prompt_text: "Do the thing",
  category_id: null,
  use_case: "Testing",
  tags: ["a", "b"],
  quality_score: 80,
  clarity_score: 80,
  specificity_score: 80,
  context_score: 80,
  structure_score: 80,
  reusability_score: 80,
  originality_score: 80,
  practical_value_score: 80,
  duplicate_probability: null,
  duplicate_of_prompt_id: null,
  security_status: "passed",
  security_notes: null,
  is_ai_optimized: true,
  original_excerpt: null,
  source_id: null,
  source_url: "https://example.com",
  source_name: "Example",
  source_author: "Author",
  source_publication_date: null,
  content_hash: "hash",
  review_status: "pending",
  reviewer_notes: null,
  recommended_action: null,
  supabase_prompt_id: null,
  google_sheet_row_id: null,
  created_at: "2026-01-01T00:00:00Z",
}

const run: ResearchRunRow = {
  id: "r1",
  status: "completed",
  started_at: "2026-01-01T00:00:00Z",
  ended_at: "2026-01-01T00:05:00Z",
  sources_scanned: 2,
  items_discovered: 4,
  items_analyzed: 4,
  items_rejected: 1,
  duplicates_found: 0,
  published_count: 0,
  pending_review_count: 3,
  input_tokens: 100,
  output_tokens: 50,
  ai_cost_usd: 0.01,
  errors: [],
  triggered_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  sheets_sync_status: "pending",
  sheets_sync_error: null,
  sheets_synced_at: null,
  drive_report_status: "pending",
  drive_report_error: null,
  drive_report_file_id: null,
  drive_report_uploaded_at: null,
}

const source: SourceRow = {
  id: "s1",
  name: "Example Source",
  url: "https://example.com/feed",
  type: "rss",
  trust_score: 80,
  enabled: true,
  last_scanned_at: null,
  scan_frequency: "weekly",
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
}

describe("sheets-schema header/row alignment", () => {
  it("New Discoveries row matches its headers length", () => {
    expect(candidateToNewDiscoveriesRow(candidate, "Category A")).toHaveLength(
      NEW_DISCOVERIES_HEADERS.length
    )
  })

  it("Weekly Reports row matches its headers length", () => {
    expect(runToWeeklyReportsRow(run, "https://drive.google.com/file/x")).toHaveLength(
      WEEKLY_REPORTS_HEADERS.length
    )
  })

  it("Sources row matches its headers length", () => {
    expect(sourceToRow(source)).toHaveLength(SOURCES_HEADERS.length)
  })

  it("every Agent Activity row matches its headers length", () => {
    for (const row of runToActivityRows(run)) {
      expect(row).toHaveLength(AGENT_ACTIVITY_HEADERS.length)
    }
  })
})
