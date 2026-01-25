import crypto from "node:crypto";

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

// scrypt parameters - these provide strong security while keeping verification under 100ms
const SCRYPT_COST = 16384; // N: CPU/memory cost (2^14)
const SCRYPT_BLOCK_SIZE = 8; // r: block size
const SCRYPT_PARALLELIZATION = 1; // p: parallelization
const SCRYPT_KEY_LENGTH = 64; // output length in bytes

/**
 * Generate a cryptographically random token
 * @param bytes Number of random bytes to generate
 * @returns Base64URL encoded random string
 */
export const randomToken = (bytes: number): string =>
  crypto.randomBytes(bytes).toString("base64url");

/**
 * Hash an API key using scrypt
 * @param rawKey Raw API key to hash
 * @param salt Salt for hashing
 * @returns Hex-encoded scrypt hash
 */
export const scryptHash = async (
  rawKey: string,
  salt: string,
): Promise<string> => {
  const derivedKey = (await scryptAsync(rawKey, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  })) as Buffer;
  return derivedKey.toString("hex");
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

  const salt = randomToken(16);
  const hash = await scryptHash(apiKey, salt);
  const hashedKey = `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt}$${hash}`;

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
 * Verify a raw API key against a stored scrypt hash
 * @param rawKey Raw API key to verify
 * @param storedHash Stored hash from database (format: scrypt$N$r$p$salt$hash)
 * @returns True if the key matches the hash
 */
export const verifyApiKey = async (
  rawKey: string,
  storedHash: string,
): Promise<boolean> => {
  const trimmed = storedHash.trim();

  // Current format: scrypt$N$r$p$salt$hash
  if (trimmed.startsWith("scrypt$")) {
    const parts = trimmed.split("$");
    if (parts.length !== 6) {
      return false;
    }

    const [, n, r, p, salt, hash] = parts;
    if (!n || !r || !p || !salt || !hash) {
      return false;
    }

    const derivedKey = await scryptAsync(rawKey, salt, SCRYPT_KEY_LENGTH, {
      N: Number.parseInt(n, 10),
      r: Number.parseInt(r, 10),
      p: Number.parseInt(p, 10),
    });
    const computed = derivedKey.toString("hex");

    return (
      computed.length === hash.length &&
      crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
    );
  }

  // ------------------------------------------------------------------
  // DEPRECATED: Legacy SHA-256 format support (read-only)
  // TODO: Remove this block once all existing API keys have been regenerated
  // ------------------------------------------------------------------
  if (trimmed.startsWith("sha256$")) {
    return verifyLegacySha256(rawKey, trimmed);
  }

  return false;
};

// ------------------------------------------------------------------
// DEPRECATED: Legacy SHA-256 verification (read-only)
// TODO: Remove these functions once all existing API keys have been regenerated
// ------------------------------------------------------------------

const isHexSha256 = (value: string): boolean => /^[a-f0-9]{64}$/i.test(value);

const sha256Hex = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const verifyLegacySha256 = (rawKey: string, storedHash: string): boolean => {
  const [, salt, hash] = storedHash.split("$");
  if (!salt || !hash || !isHexSha256(hash)) {
    return false;
  }
  const computed = sha256Hex(`${salt}:${rawKey}`);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
};
