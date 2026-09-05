import * as z from "zod"

export const ImportedPromptSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  promptText: z.string().trim().min(1),
  categoryName: z.string().trim().optional().nullable(),
  tags: z.array(z.string()).default([]),
  useCase: z.string().trim().optional().nullable(),
  difficulty: z.string().trim().optional().nullable(),
  instructions: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export type ImportedPrompt = z.infer<typeof ImportedPromptSchema>

export const ImportJsonSchema = z.object({
  prompts: z.array(
    z.object({
      title: z.string(),
      description: z.string().nullable().optional(),
      promptText: z.string(),
      categoryName: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
      useCase: z.string().nullable().optional(),
      difficulty: z.string().nullable().optional(),
      instructions: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    })
  ),
})
