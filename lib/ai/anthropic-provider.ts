import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import type {
  AIProvider,
  GenerateStructuredParams,
  GenerateStructuredResult,
  GenerateTextParams,
  GenerateTextResult,
} from "./types"

const DEFAULT_MODEL = "claude-sonnet-5"

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const
  readonly model: string
  private client: Anthropic

  constructor(model: string = DEFAULT_MODEL) {
    this.model = model
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Only some Anthropic accounts (org keys tied to a specific workspace)
      // require this; harmless to omit for a plain personal API key.
      defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
    })
  }

  async generateStructured<T>(
    params: GenerateStructuredParams<T>
  ): Promise<GenerateStructuredResult<T>> {
    const start = Date.now()

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
      output_config: {
        format: zodOutputFormat(params.schema),
      },
    })

    const latencyMs = Date.now() - start

    if (!response.parsed_output) {
      throw new Error("Anthropic returned a response that didn't match the expected schema")
    }

    return {
      data: response.parsed_output,
      provider: "anthropic",
      model: this.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    }
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    const start = Date.now()

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    })

    const latencyMs = Date.now() - start
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")

    return {
      text,
      provider: "anthropic",
      model: this.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    }
  }
}
