import hkdf from "@panva/hkdf";
import { jwtDecrypt } from "jose";

import type { JWT, JWTDecodeParams } from "./types";

/** Decodes a NextAuth.js issued JWT. */
export async function decode(params: JWTDecodeParams): Promise<JWT | null> {
  /** @note empty `salt` means a session token. See {@link JWTDecodeParams.salt}. */
  const { token, secret, salt = "" } = params;
  if (!token) return null;
  const encryptionSecret = await getDerivedEncryptionKey(secret, salt);
  const { payload } = await jwtDecrypt(token, encryptionSecret, {
    clockTolerance: 15,
  });
  return payload;
}

async function getDerivedEncryptionKey(
  keyMaterial: string | Buffer,
  salt: string,
) {
  return await hkdf(
    "sha256",
    keyMaterial,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`,
    32,
  );
}
