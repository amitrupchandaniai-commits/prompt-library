import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { Database } from "@/types/database.types"

type ResearchRunRow = Database["public"]["Tables"]["research_runs"]["Row"]
type ResearchCandidateRow = Database["public"]["Tables"]["research_candidates"]["Row"]

const PAGE_SIZE: [number, number] = [612, 792] // US Letter, points
const MARGIN = 50
const LINE_HEIGHT = 16

// Deliberately minimal — a run summary plus a candidate list. Full
// multi-format export (CSV/JSON/Markdown/PDF library-wide) is Phase 6 scope.
export async function generateWeeklyReportPdf(
  run: ResearchRunRow,
  candidates: ResearchCandidateRow[]
): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage(PAGE_SIZE)
  let y = PAGE_SIZE[1] - MARGIN

  function ensureSpace() {
    if (y < MARGIN + LINE_HEIGHT) {
      page = doc.addPage(PAGE_SIZE)
      y = PAGE_SIZE[1] - MARGIN
    }
  }

  function writeLine(text: string, options: { size?: number; font?: typeof font } = {}) {
    ensureSpace()
    page.drawText(text, {
      x: MARGIN,
      y,
      size: options.size ?? 11,
      font: options.font ?? font,
      color: rgb(0, 0, 0),
    })
    y -= LINE_HEIGHT
  }

  writeLine("Prompt Scout Weekly Report", { size: 18, font: bold })
  writeLine(new Date(run.started_at).toLocaleString(), { size: 10 })
  y -= LINE_HEIGHT / 2

  writeLine(`Status: ${run.status}`, { font: bold })
  writeLine(`Sources scanned: ${run.sources_scanned}`)
  writeLine(`Items discovered: ${run.items_discovered}`)
  writeLine(`Items analyzed: ${run.items_analyzed}`)
  writeLine(`Items rejected: ${run.items_rejected}`)
  writeLine(`Duplicates found: ${run.duplicates_found}`)
  writeLine(`Pending review: ${run.pending_review_count}`)
  writeLine(`Published: ${run.published_count}`)
  writeLine(`AI cost: $${run.ai_cost_usd.toFixed(4)}`)
  y -= LINE_HEIGHT

  writeLine(`Candidates (${candidates.length})`, { size: 13, font: bold })
  y -= LINE_HEIGHT / 2
  for (const candidate of candidates) {
    writeLine(
      `[${candidate.quality_score ?? "—"}] ${candidate.title} — ${candidate.review_status}`
    )
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
