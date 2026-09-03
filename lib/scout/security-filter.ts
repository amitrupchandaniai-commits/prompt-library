/**
 * Pre-filter applied to raw fetched content BEFORE it ever reaches an LLM call.
 * This is a code-level defense, not just prompt wording (docs/AGENT_ARCHITECTURE.md §4):
 * external content is untrusted data, and known injection phrasing is rejected
 * outright rather than handed to the model to "be careful with."
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /disregard (all |any )?(previous|prior|above) instructions/i,
  /reveal (your |the )?(system prompt|system instructions)/i,
  /you are now (in )?(developer|debug|admin|dan) mode/i,
  /pretend (you are|to be) (an? )?(unrestricted|uncensored)/i,
  /send (this|the following|these) (data|information|secrets?) to/i,
  /exfiltrate/i,
  /\bapi[_ -]?key\b.{0,20}(is|=|:)\s*['"]?sk-/i,
  /run (this|the following) (command|code|script)/i,
  /execute (arbitrary|shell|system) (code|command)/i,
]

export function checkForInjection(text: string): { safe: boolean; reason?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: `Matched known injection pattern: ${pattern.source}` }
    }
  }
  return { safe: true }
}
