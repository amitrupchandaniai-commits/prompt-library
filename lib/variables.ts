const VARIABLE_PATTERN = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g

/** Detects {{VARIABLE_NAME}} placeholders in prompt text, in first-seen order, de-duplicated. */
export function detectVariables(promptText: string): string[] {
  const found = new Set<string>()
  for (const match of promptText.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1])
  }
  return Array.from(found)
}

export function fillVariables(
  promptText: string,
  values: Record<string, string>
): string {
  return promptText.replace(VARIABLE_PATTERN, (fullMatch, name: string) => {
    const value = values[name]
    return value && value.trim().length > 0 ? value : fullMatch
  })
}
