import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"
import type { ExportablePrompt } from "./types"

const PAGE_SIZE: [number, number] = [612, 792] // US Letter, points
const MARGIN = 50
const LINE_HEIGHT = 14
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2

/**
 * Standard PDF fonts (WinAnsi encoding) can't encode arbitrary Unicode —
 * smart quotes outside cp1252, emoji, non-Latin scripts, etc. pdf-lib throws
 * synchronously on those (crashing the whole export as a 500), so swap
 * anything unencodable for "?" one character at a time.
 */
function sanitizeForPdf(text: string, font: PDFFont): string {
  let result = ""
  for (const ch of text) {
    try {
      font.widthOfTextAtSize(ch, 10)
      result += ch
    } catch {
      result += "?"
    }
  }
  return result
}

/** Greedy word-wrap to fit CONTENT_WIDTH — pdf-lib's drawText never wraps on its own. */
function wrapText(text: string, font: PDFFont, size: number): string[] {
  const lines: string[] = []
  for (const paragraph of sanitizeForPdf(text, font).split("\n")) {
    if (paragraph.length === 0) {
      lines.push("")
      continue
    }
    let current = ""
    for (const word of paragraph.split(" ")) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) > CONTENT_WIDTH && current) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

// Same manual-layout pattern as lib/google/report-pdf.ts, extended with word
// wrapping since prompt text (unlike that report's short summary lines) can
// run to full paragraphs.
export async function generatePromptsPdf(prompts: ExportablePrompt[]): Promise<Buffer> {
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

  function writeLine(text: string, options: { size?: number; font?: PDFFont } = {}) {
    ensureSpace()
    page.drawText(sanitizeForPdf(text, options.font ?? font), {
      x: MARGIN,
      y,
      size: options.size ?? 11,
      font: options.font ?? font,
      color: rgb(0, 0, 0),
    })
    y -= LINE_HEIGHT
  }

  function writeWrapped(text: string, options: { size?: number; font?: PDFFont } = {}) {
    const size = options.size ?? 10
    for (const line of wrapText(text, options.font ?? font, size)) {
      writeLine(line, options)
    }
  }

  prompts.forEach((prompt, index) => {
    if (index > 0) {
      ensureSpace()
      y -= LINE_HEIGHT / 2
    }

    writeLine(prompt.title, { size: 14, font: bold })
    writeLine(`Category: ${prompt.categoryName ?? "—"} | Tags: ${prompt.tags.join(", ") || "—"}`, {
      size: 9,
    })
    if (prompt.description) {
      y -= LINE_HEIGHT / 4
      writeWrapped(prompt.description, { size: 10 })
    }
    y -= LINE_HEIGHT / 2
    writeLine("Prompt:", { size: 10, font: bold })
    writeWrapped(prompt.promptText, { size: 9, font })
  })

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
