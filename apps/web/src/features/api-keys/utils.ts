import crypto from "node:crypto";
import { createLogger } from "@rallly/logger";

const logger = createLogger("api-key");

/**
 * Generate a cryptographically random token
 * @param bytes Number of random bytes to generate
 * @returns Base64URL encoded random string
 */
export const randomToken = (bytes: number): string =>
  crypto.randomBytes(bytes).toString("base64url");

const sha256Hex = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

/**
 * Hash an API key for storage.
 *
 * API keys carry a 24-byte random secret (192 bits of entropy), so a fast
 * hash is sufficient — brute force is infeasible regardless of hash speed.
 * A slow KDF here would only add ~100ms of CPU to every API request.
 * @param rawKey Raw API key to hash
 * @returns Stored hash in the format sha256$salt$hash
 */
export const hashApiKey = (rawKey: string): string => {
  const salt = randomToken(16);
  const hash = sha256Hex(`${salt}:${rawKey}`);
  return `sha256$${salt}$${hash}`;
};

/**
 * Create an API key with the format: sk_{prefix}_{secret}
 * @returns Object containing the full API key and components for storage
 */
export const createApiKey = async (): Promise<{
  apiKey: string;
  prefix: string;
  hashedKey: string;
}> => {
  const prefix = randomToken(6);
  const secret = randomToken(24);
  const apiKey = `sk_${prefix}_${secret}`;

  return {
    apiKey,
    prefix,
    hashedKey: hashApiKey(apiKey),
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
 * Check whether a stored hash uses the deprecated scrypt format and should
 * be re-hashed to sha256 on the next successful verification.
 */
export const isLegacyApiKeyHash = (storedHash: string): boolean =>
  storedHash.trim().startsWith("scrypt$");

/**
 * Verify a raw API key against a stored hash
 * @param rawKey Raw API key to verify
 * @param storedHash Stored hash from database (sha256$salt$hash, or the
 * deprecated scrypt$N$r$p$salt$hash format)
 * @returns True if the key matches the hash
 */
export const verifyApiKey = async (
  rawKey: string,
  storedHash: string,
): Promise<boolean> => {
  const trimmed = storedHash.trim();

  if (trimmed.startsWith("sha256$")) {
    return verifySha256(rawKey, trimmed);
  }

  // ------------------------------------------------------------------
  // DEPRECATED: scrypt format support (read-only)
  // Keys are lazily re-hashed to sha256 on successful verification; this
  // path only serves keys that haven't been used since the migration.
  // ------------------------------------------------------------------
  if (trimmed.startsWith("scrypt$")) {
    return verifyLegacyScrypt(rawKey, trimmed);
  }

  return false;
};

const isHexSha256 = (value: string): boolean => /^[a-f0-9]{64}$/i.test(value);

const verifySha256 = (rawKey: string, storedHash: string): boolean => {
  const parts = storedHash.split("$");
  if (parts.length !== 3) {
    return false;
  }
  const [, salt, hash] = parts;
  if (!salt || !hash || !isHexSha256(hash)) {
    return false;
  }
  const computed = sha256Hex(`${salt}:${rawKey}`);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
};

// ------------------------------------------------------------------
// DEPRECATED: scrypt verification (read-only)
// ------------------------------------------------------------------

const SCRYPT_KEY_LENGTH = 64;

const scryptAsync = (
  password: string,
  salt: string,
  keylen: number,
  options: crypto.ScryptOptions,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
};

const verifyLegacyScrypt = async (
  rawKey: string,
  storedHash: string,
): Promise<boolean> => {
  const parts = storedHash.split("$");
  if (parts.length !== 6) {
    return false;
  }

  const [, nStr, rStr, pStr, salt, hash] = parts;
  if (!nStr || !rStr || !pStr || !salt || !hash) {
    return false;
  }

  const N = Number.parseInt(nStr, 10);
  const r = Number.parseInt(rStr, 10);
  const p = Number.parseInt(pStr, 10);
  if (
    !Number.isSafeInteger(N) ||
    !Number.isSafeInteger(r) ||
    !Number.isSafeInteger(p) ||
    N <= 1 ||
    r <= 0 ||
    p <= 0 ||
    (N & (N - 1)) !== 0
  ) {
    return false;
  }

  let derivedKey: Buffer;
  try {
    derivedKey = await scryptAsync(rawKey, salt, SCRYPT_KEY_LENGTH, {
      N,
      r,
      p,
    });
  } catch (error) {
    logger.error({ error }, "scrypt verification failed");
    return false;
  }
  const computed = derivedKey.toString("hex");

  return (
    computed.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
  );
};
