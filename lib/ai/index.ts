import { AnthropicProvider } from "./anthropic-provider"
import { OpenAIProvider } from "./openai-provider"
import type { AIProvider, AIProviderName } from "./types"

export type { AIProvider, AIProviderName, GenerateStructuredParams, GenerateStructuredResult } from "./types"

export function getAIProvider(providerName: AIProviderName, model?: string): AIProvider {
  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider(model)
    case "openai":
      return new OpenAIProvider(model)
  }
}
