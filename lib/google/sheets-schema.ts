import type { Database } from "@/types/database.types"

type ResearchCandidateRow = Database["public"]["Tables"]["research_candidates"]["Row"]
type ResearchRunRow = Database["public"]["Tables"]["research_runs"]["Row"]
type SourceRow = Database["public"]["Tables"]["sources"]["Row"]

export const SHEET_NAMES = {
  newDiscoveries: "New Discoveries",
  approvedPrompts: "Approved Prompts",
  rejectedPrompts: "Rejected Prompts",
  weeklyReports: "Weekly Reports",
  sources: "Sources",
  agentActivity: "Agent Activity",
  trends: "Trends",
} as const

// docs/GOOGLE_INTEGRATION.md §3 lists a "Subcategory" column, but
// research_candidates has no subcategory field — omitted here rather than
// shipping a column that's permanently blank.
export const NEW_DISCOVERIES_HEADERS = [
  "Candidate ID",
  "Date Discovered",
  "Title",
  "Description",
  "Prompt",
  "Category",
  "Tags",
  "Use Case",
  "Quality Score",
  "Clarity Score",
  "Specificity Score",
  "Structure Score",
  "Reusability Score",
  "Originality Score",
  "Source",
  "Source URL",
  "Author",
  "AI Optimized",
  "Duplicate Probability",
  "Security Status",
  "Review Status",
  "Reviewer Notes",
  "Supabase Prompt ID",
  "Created At",
] as const

function cell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

export function candidateToNewDiscoveriesRow(
  candidate: ResearchCandidateRow,
  categoryName: string | null
): string[] {
  return [
    candidate.id,
    candidate.created_at,
    candidate.title,
    cell(candidate.description),
    candidate.prompt_text,
    cell(categoryName),
    candidate.tags.join(", "),
    cell(candidate.use_case),
    cell(candidate.quality_score),
    cell(candidate.clarity_score),
    cell(candidate.specificity_score),
    cell(candidate.structure_score),
    cell(candidate.reusability_score),
    cell(candidate.originality_score),
    cell(candidate.source_name),
    candidate.source_url,
    cell(candidate.source_author),
    cell(candidate.is_ai_optimized),
    cell(candidate.duplicate_probability),
    candidate.security_status,
    candidate.review_status,
    cell(candidate.reviewer_notes),
    cell(candidate.supabase_prompt_id),
    candidate.created_at,
  ]
}

export const WEEKLY_REPORTS_HEADERS = [
  "Run ID",
  "Date",
  "Status",
  "Sources Scanned",
  "Items Discovered",
  "Items Analyzed",
  "Items Rejected",
  "Duplicates Found",
  "Pending Review",
  "Published",
  "AI Cost (USD)",
  "Report PDF Link",
] as const

export function runToWeeklyReportsRow(
  run: ResearchRunRow,
  driveFileWebViewLink: string | null
): string[] {
  return [
    run.id,
    run.started_at,
    run.status,
    cell(run.sources_scanned),
    cell(run.items_discovered),
    cell(run.items_analyzed),
    cell(run.items_rejected),
    cell(run.duplicates_found),
    cell(run.pending_review_count),
    cell(run.published_count),
    run.ai_cost_usd.toFixed(4),
    cell(driveFileWebViewLink),
  ]
}

export const SOURCES_HEADERS = [
  "Source ID",
  "Name",
  "URL",
  "Type",
  "Trust Score",
  "Enabled",
  "Last Scanned",
] as const

export function sourceToRow(source: SourceRow): string[] {
  return [
    source.id,
    source.name,
    source.url,
    source.type,
    cell(source.trust_score),
    cell(source.enabled),
    cell(source.last_scanned_at),
  ]
}

export const AGENT_ACTIVITY_HEADERS = ["Timestamp", "Run ID", "Event", "Detail"] as const

// pipeline.ts has no per-event log today — these are coarse, derived summary
// rows (run started/scanned/discovered/completed), not literal instrumentation.
export function runToActivityRows(run: ResearchRunRow): string[][] {
  const timestamp = run.ended_at ?? run.started_at
  return [
    [run.started_at, run.id, "Run started", `Triggered by ${run.triggered_by ?? "unknown"}`],
    [timestamp, run.id, "Sources scanned", String(run.sources_scanned)],
    [timestamp, run.id, "Items discovered", String(run.items_discovered)],
    [timestamp, run.id, "Items analyzed", String(run.items_analyzed)],
    [timestamp, run.id, `Run ${run.status}`, `${run.pending_review_count} pending review`],
  ]
}

export const TRENDS_HEADERS = ["Week", "Trend", "Signal Strength", "Notes"] as const

type TrendRow = Database["public"]["Tables"]["trends"]["Row"]

export function trendToRow(trend: TrendRow): string[] {
  return [trend.week_start, trend.trend, trend.signal_strength, trend.notes]
}
