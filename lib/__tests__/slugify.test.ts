import { describe, expect, it } from "vitest"
import { slugify } from "@/lib/slugify"

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Go/No-Go Market Entry Analysis")).toBe("go-no-go-market-entry-analysis")
  })

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world")
  })

  it("collapses repeated non-alphanumeric runs", () => {
    expect(slugify("A!!!B???C")).toBe("a-b-c")
  })

  it("truncates to 80 characters", () => {
    const long = "word ".repeat(40)
    expect(slugify(long).length).toBeLessThanOrEqual(80)
  })
})
