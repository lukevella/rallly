import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const VERSION_LENGTH = 1; // For future algorithm migrations
// OWASP 2024 recommendation: minimum 210,000 iterations for PBKDF2-SHA256
const PBKDF2_ITERATIONS = 210000;
const CURRENT_VERSION = 1;

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param text - The plaintext to encrypt
 * @param password - The encryption key (should be from SECRET_PASSWORD env var)
 * @returns Base64 encoded string containing salt, iv, authTag, and encrypted data
 */
export function encrypt(text: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from password using PBKDF2
  const key = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    32,
    "sha256",
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from("oauth-token")); // Additional authenticated data

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine version, salt, iv, authTag, and encrypted data
  const version = Buffer.from([CURRENT_VERSION]);
  const combined = Buffer.concat([
    version,
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedData - Base64 encoded encrypted data
 * @param password - The decryption key (should be from SECRET_PASSWORD env var)
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedData: string, password: string): string {
  const combined = Buffer.from(encryptedData, "base64");

  // Extract version first
  const version = combined.subarray(0, VERSION_LENGTH)[0];

  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  // Extract components (offset by version)
  const salt = combined.subarray(VERSION_LENGTH, VERSION_LENGTH + SALT_LENGTH);
  const iv = combined.subarray(
    VERSION_LENGTH + SALT_LENGTH,
    VERSION_LENGTH + SALT_LENGTH + IV_LENGTH,
  );
  const authTag = combined.subarray(
    VERSION_LENGTH + SALT_LENGTH + IV_LENGTH,
    VERSION_LENGTH + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
  );
  const encrypted = combined.subarray(
    VERSION_LENGTH + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
  );

  // Derive key from password using PBKDF2
  const key = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    32,
    "sha256",
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from("oauth-token"));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
