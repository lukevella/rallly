import hkdf from "@panva/hkdf";
import { jwtDecrypt } from "jose";
import type { JWT } from "next-auth/jwt";

/** Decodes a NextAuth.js issued JWT. */
export async function decodeLegacyJWT(token: string): Promise<JWT | null> {
  if (!token) return null;
  const encryptionSecret = await getDerivedEncryptionKey(
    process.env.SECRET_PASSWORD,
    "",
  );
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
