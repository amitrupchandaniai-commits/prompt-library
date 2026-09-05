export type ExportablePrompt = {
  title: string
  description: string | null
  promptText: string
  categoryName: string | null
  tags: string[]
  useCase: string | null
  difficulty: string | null
  instructions: string | null
  notes: string | null
  exampleInput: string | null
  exampleOutput: string | null
  createdAt: string
}

export type ExportFormat = "txt" | "md" | "csv" | "json" | "pdf"
export type ExportScope = "prompt" | "collection" | "library"

export const EXPORT_FORMATS: { value: ExportFormat; label: string; mimeType: string; extension: string }[] = [
  { value: "txt", label: "Plain text (.txt)", mimeType: "text/plain", extension: "txt" },
  { value: "md", label: "Markdown (.md)", mimeType: "text/markdown", extension: "md" },
  { value: "csv", label: "CSV (.csv)", mimeType: "text/csv", extension: "csv" },
  { value: "json", label: "JSON (.json)", mimeType: "application/json", extension: "json" },
  { value: "pdf", label: "PDF (.pdf)", mimeType: "application/pdf", extension: "pdf" },
]
