import { describe, expect, it } from "vitest"
import { toTxt, toMarkdown, toCsv, toJson, parseCsv } from "@/lib/export/generators"
import type { ExportablePrompt } from "@/lib/export/types"

const prompt: ExportablePrompt = {
  title: "Meeting Summarizer",
  description: "Turns notes into a summary",
  promptText: "Summarize: {{NOTES}}",
  categoryName: "Productivity",
  tags: ["summarization", "meetings"],
  useCase: "Team meetings",
  difficulty: "beginner",
  instructions: "Paste raw notes",
  notes: "Works best with detailed notes",
  exampleInput: "Discussed Q3 roadmap...",
  exampleOutput: "- Q3 roadmap finalized",
  createdAt: "2026-03-05T00:00:00Z",
}

describe("toTxt", () => {
  it("includes the title and prompt text", () => {
    const output = toTxt([prompt])
    expect(output).toContain(prompt.title)
    expect(output).toContain(prompt.promptText)
  })

  it("separates multiple prompts", () => {
    const output = toTxt([prompt, { ...prompt, title: "Second" }])
    expect(output).toContain("---")
    expect(output).toContain("Second")
  })
})

describe("toMarkdown", () => {
  it("includes a heading, category/tags, and a fenced code block", () => {
    const output = toMarkdown([prompt])
    expect(output).toContain(`# ${prompt.title}`)
    expect(output).toContain("Productivity")
    expect(output).toContain("summarization, meetings")
    expect(output).toContain("```")
    expect(output).toContain(prompt.promptText)
  })
})

describe("toCsv / parseCsv round-trip", () => {
  it("escapes and correctly parses back a field with a comma and a quote", () => {
    const tricky: ExportablePrompt = {
      ...prompt,
      title: 'Say "hello", please',
      promptText: "Line one\nLine two, with a comma",
    }
    const csv = toCsv([tricky])
    const rows = parseCsv(csv)

    expect(rows).toHaveLength(2) // header + 1 data row
    expect(rows[1][0]).toBe('Say "hello", please')
    expect(rows[1][2]).toBe("Line one\nLine two, with a comma")
  })

  it("round-trips multiple prompts", () => {
    const csv = toCsv([prompt, { ...prompt, title: "Second" }])
    const rows = parseCsv(csv)
    expect(rows).toHaveLength(3) // header + 2 rows
    expect(rows[1][0]).toBe(prompt.title)
    expect(rows[2][0]).toBe("Second")
  })
})

describe("toJson", () => {
  it("produces valid JSON that parses back to the same data", () => {
    const json = toJson([prompt])
    const parsed = JSON.parse(json)
    expect(parsed.prompts).toEqual([prompt])
  })
})
