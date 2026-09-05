import type { ExportablePrompt } from "./types"

export function toTxt(prompts: ExportablePrompt[]): string {
  return prompts
    .map((p) => {
      const lines = [p.title, "", p.description ?? "", "", p.promptText]
      if (p.categoryName || p.tags.length > 0) {
        lines.push("", `Category: ${p.categoryName ?? "—"} | Tags: ${p.tags.join(", ") || "—"}`)
      }
      return lines.join("\n")
    })
    .join("\n\n---\n\n")
}

export function toMarkdown(prompts: ExportablePrompt[]): string {
  return prompts
    .map((p) => {
      const parts = [`# ${p.title}`]
      if (p.description) parts.push(`> ${p.description}`)
      parts.push(`**Category:** ${p.categoryName ?? "—"} | **Tags:** ${p.tags.join(", ") || "—"}`)
      if (p.useCase) parts.push(`**Use case:** ${p.useCase}`)
      parts.push("", "```", p.promptText, "```")
      if (p.instructions) parts.push("", "**Instructions:**", "", p.instructions)
      if (p.notes) parts.push("", "**Notes:**", "", p.notes)
      return parts.join("\n")
    })
    .join("\n\n---\n\n")
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const CSV_COLUMNS = ["Title", "Description", "Prompt Text", "Category", "Tags", "Use Case", "Difficulty", "Created At"] as const

export function toCsv(prompts: ExportablePrompt[]): string {
  const header = CSV_COLUMNS.join(",")
  const rows = prompts.map((p) =>
    [
      p.title,
      p.description ?? "",
      p.promptText,
      p.categoryName ?? "",
      p.tags.join("; "),
      p.useCase ?? "",
      p.difficulty ?? "",
      p.createdAt,
    ]
      .map(csvEscape)
      .join(",")
  )
  return [header, ...rows].join("\n")
}

export function toJson(prompts: ExportablePrompt[]): string {
  return JSON.stringify({ prompts }, null, 2)
}

/**
 * Parses CSV in the exact shape `toCsv` writes (respecting quoted fields
 * that contain commas, quotes, or newlines) into raw string rows, header
 * row included. A small hand-rolled state machine — no CSV library is
 * installed, and this app already hand-rolls what it needs elsewhere.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""))
}
