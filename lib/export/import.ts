import { parseCsv } from "./generators"
import { ImportJsonSchema, type ImportedPrompt } from "@/lib/validations/import"

export type ImportFormat = "json" | "csv" | "txt"

export type ParsedImportRow =
  | { success: true; prompt: ImportedPrompt }
  | { success: false; index: number; reason: string }

function splitTags(value: string): string[] {
  return value
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
}

export function parseJsonImport(text: string): ParsedImportRow[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return [{ success: false, index: 0, reason: "Not valid JSON" }]
  }

  const result = ImportJsonSchema.safeParse(parsed)
  if (!result.success) {
    return [{ success: false, index: 0, reason: "JSON doesn't match the expected { prompts: [...] } shape" }]
  }

  return result.data.prompts.map((p) => ({
    success: true as const,
    prompt: {
      title: p.title,
      description: p.description ?? null,
      promptText: p.promptText,
      categoryName: p.categoryName ?? null,
      tags: p.tags ?? [],
      useCase: p.useCase ?? null,
      difficulty: p.difficulty ?? null,
      instructions: p.instructions ?? null,
      notes: p.notes ?? null,
    },
  }))
}

const CSV_IMPORT_COLUMNS = ["title", "description", "promptText", "categoryName", "tags", "useCase", "difficulty"] as const

export function parseCsvImport(text: string): ParsedImportRow[] {
  const rows = parseCsv(text)
  if (rows.length === 0) return []

  const [, ...dataRows] = rows // first row is the header, matching toCsv's output

  return dataRows.map((row, index) => {
    if (!row[0] || !row[2]) {
      return { success: false, index, reason: "Missing Title or Prompt Text" }
    }
    const record: Record<string, string> = {}
    CSV_IMPORT_COLUMNS.forEach((key, i) => {
      record[key] = row[i] ?? ""
    })
    return {
      success: true,
      prompt: {
        title: record.title,
        description: record.description || null,
        promptText: record.promptText,
        categoryName: record.categoryName || null,
        tags: splitTags(record.tags),
        useCase: record.useCase || null,
        difficulty: record.difficulty || null,
        instructions: null,
        notes: null,
      },
    }
  })
}

export function parseTxtImport(text: string, filename: string): ParsedImportRow[] {
  const trimmed = text.trim()
  if (!trimmed) return [{ success: false, index: 0, reason: "File is empty" }]

  const title = filename.replace(/\.[^.]+$/, "") || "Imported Prompt"
  return [
    {
      success: true,
      prompt: {
        title,
        description: null,
        promptText: trimmed,
        categoryName: null,
        tags: [],
        useCase: null,
        difficulty: null,
        instructions: null,
        notes: null,
      },
    },
  ]
}

export function parseImportFile(format: ImportFormat, text: string, filename: string): ParsedImportRow[] {
  switch (format) {
    case "json":
      return parseJsonImport(text)
    case "csv":
      return parseCsvImport(text)
    case "txt":
      return parseTxtImport(text, filename)
  }
}
