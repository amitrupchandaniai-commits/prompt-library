import * as z from "zod"

export const PromptBuilderInputSchema = z.object({
  objective: z.string().trim().min(1, "Tell me what you want AI to help you accomplish"),
  role: z.string().trim().max(300).optional(),
  context: z.string().trim().max(2000).optional(),
  input: z.string().trim().max(2000).optional(),
  audience: z.string().trim().max(300).optional(),
  constraints: z.string().trim().max(1000).optional(),
  examples: z.string().trim().max(2000).optional(),
  tone: z.string().trim().max(200).optional(),
  outputFormat: z.string().trim().max(500).optional(),
  successCriteria: z.string().trim().max(1000).optional(),
})

export type PromptBuilderInput = z.infer<typeof PromptBuilderInputSchema>

export const PromptBuilderOutputSchema = z.object({
  title: z.string().describe("A short, specific title for this prompt (under 60 characters)"),
  description: z.string().describe("One sentence summarizing what this prompt does"),
  promptText: z
    .string()
    .describe(
      "The complete, ready-to-use prompt text, organized with clear sections (Role, Objective, Context, Input, Instructions, Constraints, Output Format, Quality Criteria) — omit any section with no corresponding input"
    ),
})

export type PromptBuilderOutput = z.infer<typeof PromptBuilderOutputSchema>
