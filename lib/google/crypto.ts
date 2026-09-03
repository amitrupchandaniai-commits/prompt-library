import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

// AES-256-GCM. Ciphertext layout: [12-byte IV][16-byte auth tag][encrypted bytes],
// all base64-encoded as one string. Chosen over Supabase Vault (see
// docs/GOOGLE_INTEGRATION.md §7): Vault would need new `security definer`
// Postgres functions, meaningfully more migration surface and a new class of
// bug for a project with no existing Vault usage. This keeps token security
// logic in TS, consistent with lib/scout/security-filter.ts. Revisit as part
// of the Phase 7 hardening pass.
//
// No `import "server-only"` guard here (unlike lib/dal.ts/lib/audit.ts):
// node:crypto can't bundle into a client component anyway, and this module is
// unit-tested directly (vitest can't resolve the Next-only "server-only"
// specifier — see lib/scout/security-filter.ts for the same tested-module pattern).
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function loadKey(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY env var is not set")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes")
  }
  return key
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, loadKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

export function decryptToken(ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, "base64")
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, loadKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
