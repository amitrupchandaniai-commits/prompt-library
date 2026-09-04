import * as z from "zod"

export const SIGNAL_STRENGTHS = ["high", "medium", "low"] as const

export const TrendDetectionSchema = z.object({
  trends: z
    .array(
      z.object({
        trend: z
          .string()
          .describe("A short, specific name for the emerging theme (e.g. 'Chain-of-thought reasoning prompts')"),
        signalStrength: z.enum(SIGNAL_STRENGTHS),
        notes: z.string().describe("1-2 sentences explaining the evidence for this trend"),
      })
    )
    .max(5),
})

export type TrendDetectionResult = z.infer<typeof TrendDetectionSchema>
