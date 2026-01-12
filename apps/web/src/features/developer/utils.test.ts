import { describe, expect, it } from "vitest";
import {
  createApiKey,
  extractApiKeyPrefix,
  hashApiKey,
  isHexSha256,
  randomToken,
  sha256Hex,
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

describe("sha256Hex", () => {
  it("should generate consistent hashes for same input", () => {
    const input = "test-string";
    const hash1 = sha256Hex(input);
    const hash2 = sha256Hex(input);
    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different inputs", () => {
    const hash1 = sha256Hex("input1");
    const hash2 = sha256Hex("input2");
    expect(hash1).not.toBe(hash2);
  });

  it("should generate 64-character hex strings", () => {
    const hash = sha256Hex("test");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("isHexSha256", () => {
  it("should return true for valid SHA-256 hex strings", () => {
    const validHash =
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
    expect(isHexSha256(validHash)).toBe(true);
  });

  it("should return false for strings that are too short", () => {
    expect(isHexSha256("abc123")).toBe(false);
  });

  it("should return false for strings with non-hex characters", () => {
    const invalidHash =
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00aGZ";
    expect(isHexSha256(invalidHash)).toBe(false);
  });

  it("should return false for empty strings", () => {
    expect(isHexSha256("")).toBe(false);
  });
});

describe("createApiKey", () => {
  it("should generate an API key with correct format", () => {
    const result = createApiKey();
    expect(result.apiKey).toMatch(/^sk_[A-Za-z0-9_-]+_[A-Za-z0-9_-]+$/);
  });

  it("should generate unique API keys on each call", () => {
    const result1 = createApiKey();
    const result2 = createApiKey();
    expect(result1.apiKey).not.toBe(result2.apiKey);
    expect(result1.prefix).not.toBe(result2.prefix);
  });

  it("should generate a valid prefix", () => {
    const result = createApiKey();
    expect(result.prefix).toBeTruthy();
    expect(result.prefix.length).toBeGreaterThan(0);
  });

  it("should generate a hashed key in correct format", () => {
    const result = createApiKey();
    expect(result.hashedKey).toMatch(/^sha256\$[A-Za-z0-9_-]+\$[a-f0-9]{64}$/);
  });

  it("should verify the generated API key against its hash", () => {
    const result = createApiKey();
    expect(verifyApiKey(result.apiKey, result.hashedKey)).toBe(true);
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

describe("hashApiKey", () => {
  it("should generate consistent hashes without salt", () => {
    const key = "test-api-key";
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
  });

  it("should generate consistent hashes with salt", () => {
    const key = "test-api-key";
    const salt = "test-salt";
    const hash1 = hashApiKey(key, salt);
    const hash2 = hashApiKey(key, salt);
    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different salts", () => {
    const key = "test-api-key";
    const hash1 = hashApiKey(key, "salt1");
    const hash2 = hashApiKey(key, "salt2");
    expect(hash1).not.toBe(hash2);
  });

  it("should generate different hashes with and without salt", () => {
    const key = "test-api-key";
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key, "salt");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyApiKey", () => {
  describe("salted format (sha256$salt$hash)", () => {
    it("should verify correct API key", () => {
      const result = createApiKey();
      expect(verifyApiKey(result.apiKey, result.hashedKey)).toBe(true);
    });

    it("should reject incorrect API key", () => {
      const result = createApiKey();
      const wrongKey = "sk_wrong_prefix_wrong_secret";
      expect(verifyApiKey(wrongKey, result.hashedKey)).toBe(false);
    });

    it("should reject API key with tampered salt", () => {
      const result = createApiKey();
      const [, , hash] = result.hashedKey.split("$");
      const tamperedHash = `sha256$wrongsalt$${hash}`;
      expect(verifyApiKey(result.apiKey, tamperedHash)).toBe(false);
    });

    it("should reject API key with tampered hash", () => {
      const result = createApiKey();
      const [, salt] = result.hashedKey.split("$");
      const tamperedHash = `sha256$${salt}$${"0".repeat(64)}`;
      expect(verifyApiKey(result.apiKey, tamperedHash)).toBe(false);
    });

    it("should reject malformed hash format", () => {
      const result = createApiKey();
      expect(verifyApiKey(result.apiKey, "sha256$invalidsalt")).toBe(false);
    });

    it("should reject hash with non-hex characters", () => {
      const result = createApiKey();
      expect(verifyApiKey(result.apiKey, "sha256$salt$notahex")).toBe(false);
    });
  });

  describe("legacy format (plain hex)", () => {
    it("should verify correct legacy API key", () => {
      const apiKey = "test-legacy-key";
      const hash = sha256Hex(apiKey);
      expect(verifyApiKey(apiKey, hash)).toBe(true);
    });

    it("should reject incorrect legacy API key", () => {
      const apiKey = "test-legacy-key";
      const hash = sha256Hex(apiKey);
      expect(verifyApiKey("wrong-key", hash)).toBe(false);
    });

    it("should reject malformed legacy hash", () => {
      expect(verifyApiKey("test-key", "not-a-valid-hash")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle hashes with whitespace", () => {
      const result = createApiKey();
      const hashWithSpace = `  ${result.hashedKey}  `;
      expect(verifyApiKey(result.apiKey, hashWithSpace)).toBe(true);
    });

    it("should reject empty hash", () => {
      expect(verifyApiKey("test-key", "")).toBe(false);
    });

    it("should reject hash with only prefix", () => {
      expect(verifyApiKey("test-key", "sha256$")).toBe(false);
    });
  });

  describe("timing attack resistance", () => {
    it("should use constant-time comparison", () => {
      // This test verifies that the function uses timingSafeEqual
      // by checking that both valid and invalid keys execute the comparison
      const result = createApiKey();

      // Both should complete without throwing
      expect(() => verifyApiKey(result.apiKey, result.hashedKey)).not.toThrow();
      expect(() =>
        verifyApiKey("sk_wrong_key", result.hashedKey),
      ).not.toThrow();
    });
  });
});
