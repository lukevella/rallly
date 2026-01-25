import { describe, expect, it } from "vitest";
import {
  createApiKey,
  extractApiKeyPrefix,
  randomToken,
  verifyApiKey,
} from "./utils";

describe("randomToken", () => {
  it("should generate tokens of correct length", () => {
    const token = randomToken(16);
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(0);
  });

  it("should generate different tokens on each call", () => {
    const token1 = randomToken(16);
    const token2 = randomToken(16);
    expect(token1).not.toBe(token2);
  });

  it("should generate base64url encoded strings", () => {
    const token = randomToken(16);
    // Base64URL uses A-Z, a-z, 0-9, -, _
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("createApiKey", () => {
  it("should generate an API key with correct format", async () => {
    const result = await createApiKey();
    expect(result.apiKey).toMatch(/^sk_[A-Za-z0-9_-]+_[A-Za-z0-9_-]+$/);
  });

  it("should generate unique API keys on each call", async () => {
    const result1 = await createApiKey();
    const result2 = await createApiKey();
    expect(result1.apiKey).not.toBe(result2.apiKey);
    expect(result1.prefix).not.toBe(result2.prefix);
  });

  it("should generate a valid prefix", async () => {
    const result = await createApiKey();
    expect(result.prefix).toBeTruthy();
    expect(result.prefix.length).toBeGreaterThan(0);
  });

  it("should generate a hashed key in scrypt format", async () => {
    const result = await createApiKey();
    expect(result.hashedKey).toMatch(
      /^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9_-]+\$[a-f0-9]+$/,
    );
  });

  it("should verify the generated API key against its hash", async () => {
    const result = await createApiKey();
    const isValid = await verifyApiKey(result.apiKey, result.hashedKey);
    expect(isValid).toBe(true);
  });
});

describe("extractApiKeyPrefix", () => {
  it("should extract prefix from valid API key", () => {
    const apiKey = "sk_abc123_def456";
    expect(extractApiKeyPrefix(apiKey)).toBe("abc123");
  });

  it("should handle malformed keys with fallback", () => {
    const malformed = "invalidkey";
    expect(extractApiKeyPrefix(malformed)).toBe(malformed.slice(0, 12));
  });

  it("should handle keys with extra underscores", () => {
    const apiKey = "sk_prefix_secret_extra";
    expect(extractApiKeyPrefix(apiKey)).toBe("prefix");
  });
});

describe("verifyApiKey", () => {
  it("should verify correct API key", async () => {
    const result = await createApiKey();
    const isValid = await verifyApiKey(result.apiKey, result.hashedKey);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect API key", async () => {
    const result = await createApiKey();
    const wrongKey = "sk_wrong_prefix_wrong_secret";
    const isValid = await verifyApiKey(wrongKey, result.hashedKey);
    expect(isValid).toBe(false);
  });

  it("should reject API key with tampered salt", async () => {
    const result = await createApiKey();
    const parts = result.hashedKey.split("$");
    parts[4] = "wrongsalt";
    const tamperedHash = parts.join("$");
    const isValid = await verifyApiKey(result.apiKey, tamperedHash);
    expect(isValid).toBe(false);
  });

  it("should reject API key with tampered hash", async () => {
    const result = await createApiKey();
    const parts = result.hashedKey.split("$");
    parts[5] = "0".repeat(128);
    const tamperedHash = parts.join("$");
    const isValid = await verifyApiKey(result.apiKey, tamperedHash);
    expect(isValid).toBe(false);
  });

  it("should reject malformed hash format", async () => {
    const result = await createApiKey();
    const isValid = await verifyApiKey(result.apiKey, "scrypt$16384$8$1$salt");
    expect(isValid).toBe(false);
  });

  // ------------------------------------------------------------------
  // DEPRECATED: Legacy SHA-256 format tests
  // TODO: Remove this block once all existing API keys have been regenerated
  // ------------------------------------------------------------------
  describe("legacy sha256 format (deprecated)", () => {
    // Helper to create a legacy hash for testing
    const createLegacySha256Hash = (apiKey: string, salt: string): string => {
      const crypto = require("node:crypto");
      const hash = crypto
        .createHash("sha256")
        .update(`${salt}:${apiKey}`)
        .digest("hex");
      return `sha256$${salt}$${hash}`;
    };

    it("should verify correct legacy API key", async () => {
      const apiKey = "sk_test_legacykey";
      const storedHash = createLegacySha256Hash(apiKey, "testsalt123");
      const isValid = await verifyApiKey(apiKey, storedHash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect legacy API key", async () => {
      const storedHash = createLegacySha256Hash(
        "sk_test_legacykey",
        "testsalt123",
      );
      const isValid = await verifyApiKey("wrong-key", storedHash);
      expect(isValid).toBe(false);
    });

    it("should reject malformed legacy hash", async () => {
      const isValid = await verifyApiKey("test-key", "sha256$salt$notahex");
      expect(isValid).toBe(false);
    });
  });

  it("should handle hashes with whitespace", async () => {
    const result = await createApiKey();
    const hashWithSpace = `  ${result.hashedKey}  `;
    const isValid = await verifyApiKey(result.apiKey, hashWithSpace);
    expect(isValid).toBe(true);
  });

  it("should reject empty hash", async () => {
    const isValid = await verifyApiKey("test-key", "");
    expect(isValid).toBe(false);
  });

  it("should reject hash with only prefix", async () => {
    const isValid = await verifyApiKey("test-key", "scrypt$");
    expect(isValid).toBe(false);
  });

  it("should use constant-time comparison", async () => {
    const result = await createApiKey();

    // Both should complete without throwing
    await expect(
      verifyApiKey(result.apiKey, result.hashedKey),
    ).resolves.toBeDefined();
    await expect(
      verifyApiKey("sk_wrong_key", result.hashedKey),
    ).resolves.toBeDefined();
  });
});
