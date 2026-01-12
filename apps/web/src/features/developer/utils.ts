import crypto from "node:crypto";

/**
 * Generate a cryptographically random token
 * @param bytes Number of random bytes to generate
 * @returns Base64URL encoded random string
 */
export const randomToken = (bytes: number): string =>
  crypto.randomBytes(bytes).toString("base64url");

/**
 * Hash a value using SHA-256
 * @param value String to hash
 * @returns Hex-encoded SHA-256 hash
 */
export const sha256Hex = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

/**
 * Create an API key with the format: sk_{prefix}_{secret}
 * @returns Object containing the full API key and components for storage
 */
export const createApiKey = (): {
  apiKey: string;
  prefix: string;
  hashedKey: string;
} => {
  const prefix = randomToken(6);
  const secret = randomToken(24);
  const apiKey = `sk_${prefix}_${secret}`;

  const salt = randomToken(12);
  const hashedKey = `sha256$${salt}$${sha256Hex(`${salt}:${apiKey}`)}`;

  return {
    apiKey,
    prefix,
    hashedKey,
  };
};

/**
 * Extract the prefix from a raw API key
 * @param rawKey Raw API key in format sk_{prefix}_{secret}
 * @returns The prefix portion
 */
export const extractApiKeyPrefix = (rawKey: string): string => {
  const parts = rawKey.split("_").filter(Boolean);
  if (parts.length >= 3 && parts[1]) {
    return parts[1];
  }
  // Fallback for malformed keys
  return rawKey.slice(0, 12);
};

/**
 * Check if a string is a valid hex SHA-256 hash
 * @param value String to validate
 * @returns True if valid hex SHA-256 (64 characters)
 */
export const isHexSha256 = (value: string): boolean =>
  /^[a-f0-9]{64}$/i.test(value);

/**
 * Hash an API key with optional salt (for verification)
 * @param rawKey Raw API key
 * @param salt Optional salt for hashing
 * @returns Hex-encoded SHA-256 hash
 */
export const hashApiKey = (rawKey: string, salt?: string): string => {
  const input = salt ? `${salt}:${rawKey}` : rawKey;
  return sha256Hex(input);
};

/**
 * Verify a raw API key against a stored hash
 * Supports both legacy (unsalted) and current (salted) hash formats
 * @param rawKey Raw API key to verify
 * @param storedHash Stored hash from database (format: "sha256$salt$hash" or plain hex)
 * @returns True if the key matches the hash
 */
export const verifyApiKey = (rawKey: string, storedHash: string): boolean => {
  const trimmed = storedHash.trim();

  // Current format: sha256$salt$hash
  if (trimmed.startsWith("sha256$")) {
    const [, salt, hash] = trimmed.split("$");
    if (!salt || !hash || !isHexSha256(hash)) {
      return false;
    }
    const computed = hashApiKey(rawKey, salt);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }

  // Legacy format: plain hex hash (unsalted)
  if (!isHexSha256(trimmed)) {
    return false;
  }

  const computed = hashApiKey(rawKey);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(trimmed));
};
