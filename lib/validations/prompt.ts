import * as z from "zod"

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const

export const PromptSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  promptText: z.string().trim().min(1, "Prompt text is required"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  subcategory: z.string().trim().max(120).optional().or(z.literal("")),
  useCase: z.string().trim().max(200).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  difficulty: z.enum(DIFFICULTIES).optional().or(z.literal("")),
  promptType: z.string().trim().max(120).optional().or(z.literal("")),
  recommendedModels: z.array(z.string().trim().min(1)).default([]),
  exampleInput: z.string().trim().max(5000).optional().or(z.literal("")),
  exampleOutput: z.string().trim().max(5000).optional().or(z.literal("")),
  instructions: z.string().trim().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(60)).default([]),
})

export type PromptInput = z.infer<typeof PromptSchema>

export const CollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type CollectionInput = z.infer<typeof CollectionSchema>
