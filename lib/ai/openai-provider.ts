import "server-only"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import type { AIProvider, GenerateStructuredParams, GenerateStructuredResult } from "./types"

// NOTE: model default not verified against a live source in this session the
// way the Anthropic default was — confirm against platform.openai.com/docs/models
// before relying on this for anything beyond a manual test.
const DEFAULT_MODEL = "gpt-5.1"

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const
  readonly model: string
  private client: OpenAI

  constructor(model: string = DEFAULT_MODEL) {
    this.model = model
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async generateStructured<T>(
    params: GenerateStructuredParams<T>
  ): Promise<GenerateStructuredResult<T>> {
    const start = Date.now()

    const completion = await this.client.chat.completions.parse({
      model: this.model,
      max_completion_tokens: params.maxTokens ?? 4096,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.prompt },
      ],
      response_format: zodResponseFormat(params.schema, params.schemaName),
    })

    const latencyMs = Date.now() - start
    const parsed = completion.choices[0]?.message.parsed

    if (!parsed) {
      throw new Error("OpenAI returned a response that didn't match the expected schema")
    }

    return {
      data: parsed,
      provider: "openai",
      model: this.model,
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
      latencyMs,
    }
  }
}
