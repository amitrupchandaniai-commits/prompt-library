import { describe, expect, it } from "vitest"
import { parseJsonImport, parseCsvImport, parseTxtImport } from "@/lib/export/import"
import { toCsv, toJson } from "@/lib/export/generators"
import type { ExportablePrompt } from "@/lib/export/types"

const prompt: ExportablePrompt = {
  title: "Meeting Summarizer",
  description: "Turns notes into a summary",
  promptText: "Summarize: {{NOTES}}",
  categoryName: "Productivity",
  tags: ["summarization", "meetings"],
  useCase: "Team meetings",
  difficulty: "beginner",
  instructions: null,
  notes: null,
  exampleInput: null,
  exampleOutput: null,
  createdAt: "2026-03-05T00:00:00Z",
}

describe("parseJsonImport", () => {
  it("round-trips a file produced by toJson", () => {
    const rows = parseJsonImport(toJson([prompt]))
    expect(rows).toHaveLength(1)
    expect(rows[0].success).toBe(true)
    if (rows[0].success) {
      expect(rows[0].prompt.title).toBe(prompt.title)
      expect(rows[0].prompt.tags).toEqual(prompt.tags)
    }
  })

  it("reports invalid JSON without throwing", () => {
    const rows = parseJsonImport("not json{")
    expect(rows).toEqual([{ success: false, index: 0, reason: "Not valid JSON" }])
  })

  it("reports JSON that doesn't match the expected shape", () => {
    const rows = parseJsonImport(JSON.stringify({ notPrompts: [] }))
    expect(rows[0].success).toBe(false)
  })
})

describe("parseCsvImport", () => {
  it("round-trips a file produced by toCsv, including a comma/quote field", () => {
    const tricky: ExportablePrompt = { ...prompt, title: 'Say "hi", now' }
    const rows = parseCsvImport(toCsv([prompt, tricky]))
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.success)).toBe(true)
    expect(rows[1].success && rows[1].prompt.title).toBe('Say "hi", now')
  })

  it("flags a row missing Title or Prompt Text", () => {
    const rows = parseCsvImport("Title,Description,Prompt Text\n,desc,")
    expect(rows[0]).toEqual({ success: false, index: 0, reason: "Missing Title or Prompt Text" })
  })
})

describe("parseTxtImport", () => {
  it("treats the whole file as one prompt's text, titled from the filename", () => {
    const rows = parseTxtImport("Do the thing.", "my-cool-prompt.txt")
    expect(rows).toHaveLength(1)
    expect(rows[0].success && rows[0].prompt.title).toBe("my-cool-prompt")
    expect(rows[0].success && rows[0].prompt.promptText).toBe("Do the thing.")
  })

  it("rejects an empty file", () => {
    const rows = parseTxtImport("   ", "empty.txt")
    expect(rows[0].success).toBe(false)
  })
})
