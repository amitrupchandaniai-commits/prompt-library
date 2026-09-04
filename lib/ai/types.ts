import type { ZodType } from "zod"

export type AIProviderName = "anthropic" | "openai"

export type GenerateStructuredParams<T> = {
  system: string
  prompt: string
  schema: ZodType<T>
  schemaName: string
  maxTokens?: number
}

export type GenerateStructuredResult<T> = {
  data: T
  provider: AIProviderName
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

export type GenerateTextParams = {
  system?: string
  prompt: string
  maxTokens?: number
}

export type GenerateTextResult = {
  text: string
  provider: AIProviderName
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

export interface AIProvider {
  readonly name: AIProviderName
  readonly model: string
  generateStructured<T>(params: GenerateStructuredParams<T>): Promise<GenerateStructuredResult<T>>
  /** Raw text completion, no schema — for Prompt Tester, which wants a model's actual output, not a parsed shape. */
  generateText(params: GenerateTextParams): Promise<GenerateTextResult>
}
