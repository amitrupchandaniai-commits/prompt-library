import * as z from "zod"

export const TesterInputSchema = z.object({
  promptText: z.string().trim().min(1, "Paste a prompt to test"),
})

export const AVAILABLE_MODELS = [
  { provider: "anthropic", model: "claude-opus-5", label: "Claude Opus 5" },
  { provider: "anthropic", model: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { provider: "anthropic", model: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { provider: "openai", model: "gpt-5.1", label: "GPT-5.1" },
  { provider: "openai", model: "gpt-5.1-mini", label: "GPT-5.1 Mini" },
] as const

export type TesterModelSelection = { provider: "anthropic" | "openai"; model: string }
