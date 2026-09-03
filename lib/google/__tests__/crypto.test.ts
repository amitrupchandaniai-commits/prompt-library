import { beforeAll, describe, expect, it } from "vitest"
import { encryptToken, decryptToken } from "@/lib/google/crypto"

beforeAll(() => {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")
})

describe("encryptToken/decryptToken", () => {
  it("round-trips a plaintext token", () => {
    const plaintext = "ya29.a0AfH6SMB_example_access_token"
    expect(decryptToken(encryptToken(plaintext))).toBe(plaintext)
  })

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plaintext = "1//0gExampleRefreshToken"
    expect(encryptToken(plaintext)).not.toBe(encryptToken(plaintext))
  })

  it("throws when the ciphertext has been tampered with", () => {
    const tampered = Buffer.from(encryptToken("some-token"), "base64")
    tampered[tampered.length - 1] ^= 0xff
    expect(() => decryptToken(tampered.toString("base64"))).toThrow()
  })
})
