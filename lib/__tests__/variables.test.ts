import { describe, expect, it } from "vitest"
import { detectVariables, fillVariables } from "@/lib/variables"

describe("detectVariables", () => {
  it("finds all unique {{VARIABLE}} placeholders in order", () => {
    const text = "Hello {{NAME}}, welcome to {{COMPANY_NAME}}. Again, {{NAME}}!"
    expect(detectVariables(text)).toEqual(["NAME", "COMPANY_NAME"])
  })

  it("returns an empty array when there are no placeholders", () => {
    expect(detectVariables("Just plain text.")).toEqual([])
  })

  it("ignores lowercase or mixed-case braces", () => {
    expect(detectVariables("{{lowercase}} and {{Mixed_Case}}")).toEqual([])
  })
})

describe("fillVariables", () => {
  it("replaces provided values", () => {
    const filled = fillVariables("Hi {{NAME}}, from {{COMPANY_NAME}}.", {
      NAME: "Amit",
      COMPANY_NAME: "Acme",
    })
    expect(filled).toBe("Hi Amit, from Acme.")
  })

  it("leaves a placeholder untouched when no value is given", () => {
    const filled = fillVariables("Hi {{NAME}}.", {})
    expect(filled).toBe("Hi {{NAME}}.")
  })

  it("leaves a placeholder untouched when the value is blank", () => {
    const filled = fillVariables("Hi {{NAME}}.", { NAME: "   " })
    expect(filled).toBe("Hi {{NAME}}.")
  })
})
