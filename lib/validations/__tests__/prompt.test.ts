import { describe, expect, it } from "vitest"
import { PromptSchema, CollectionSchema } from "@/lib/validations/prompt"

describe("PromptSchema", () => {
  const base = { title: "Test Prompt", promptText: "Do the thing." }

  it("accepts a minimal valid prompt", () => {
    const result = PromptSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it("rejects an empty title", () => {
    const result = PromptSchema.safeParse({ ...base, title: "" })
    expect(result.success).toBe(false)
  })

  it("rejects empty prompt text", () => {
    const result = PromptSchema.safeParse({ ...base, promptText: "" })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid difficulty", () => {
    const result = PromptSchema.safeParse({ ...base, difficulty: "expert" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid difficulty", () => {
    const result = PromptSchema.safeParse({ ...base, difficulty: "advanced" })
    expect(result.success).toBe(true)
  })

  it("defaults tags and recommendedModels to empty arrays", () => {
    const result = PromptSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual([])
      expect(result.data.recommendedModels).toEqual([])
    }
  })
})

describe("CollectionSchema", () => {
  it("requires a name", () => {
    expect(CollectionSchema.safeParse({ name: "" }).success).toBe(false)
    expect(CollectionSchema.safeParse({ name: "My Collection" }).success).toBe(true)
  })
})
