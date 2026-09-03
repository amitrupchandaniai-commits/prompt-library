import * as z from "zod"

export const ImproverInputSchema = z.object({
  promptText: z.string().trim().min(1, "Paste a prompt to analyze"),
})

export const ImproverScoresSchema = z.object({
  clarity: z.number().min(0).max(100),
  context: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  structure: z.number().min(0).max(100),
  constraints: z.number().min(0).max(100),
  outputDefinition: z.number().min(0).max(100),
  reusability: z.number().min(0).max(100),
})

export type ImproverScores = z.infer<typeof ImproverScoresSchema>

export const ImproverOutputSchema = z.object({
  scores: ImproverScoresSchema,
  problemsFound: z.array(z.string()).describe("Specific issues found in the original prompt"),
  recommendations: z
    .array(z.string())
    .describe("Specific, actionable recommendations addressing the problems found"),
  improvedPrompt: z
    .string()
    .describe(
      "The rewritten prompt — must preserve the original's intent and goal exactly, only improving clarity, structure, specificity, constraints, and output definition"
    ),
  explanation: z.string().describe("A short explanation of what changed and why"),
})

export type ImproverOutput = z.infer<typeof ImproverOutputSchema>

export const SCORE_LABELS: Record<keyof ImproverScores, string> = {
  clarity: "Clarity",
  context: "Context",
  specificity: "Specificity",
  structure: "Structure",
  constraints: "Constraints",
  outputDefinition: "Output Definition",
  reusability: "Reusability",
}

export function overallScore(scores: ImproverScores): number {
  const values = Object.values(scores)
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}
