import { describe, expect, it } from "vitest"
import { overallScore } from "@/lib/validations/prompt-improver"

describe("overallScore", () => {
  it("averages all seven dimensions", () => {
    const score = overallScore({
      clarity: 100,
      context: 100,
      specificity: 100,
      structure: 100,
      constraints: 100,
      outputDefinition: 100,
      reusability: 100,
    })
    expect(score).toBe(100)
  })

  it("rounds to the nearest whole number", () => {
    const score = overallScore({
      clarity: 80,
      context: 70,
      specificity: 60,
      structure: 90,
      constraints: 50,
      outputDefinition: 100,
      reusability: 65,
    })
    expect(score).toBe(74) // 515 / 7 = 73.57...
  })
})
