import hkdf from "@panva/hkdf";
import { EncryptJWT } from "jose";
import type { JWT } from "next-auth/jwt";

const now = () => (Date.now() / 1000) | 0;
export async function getDerivedEncryptionKey(
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

interface JWTEncodeParams {
  token?: JWT;
  salt?: string;
  secret: string | Buffer;
  maxAge?: number;
}

export async function encode(params: JWTEncodeParams) {
  /** @note empty `salt` means a session token. See {@link JWTEncodeParams.salt}. */
  const { token = {}, secret, maxAge = 30 * 24 * 60 * 60, salt = "" } = params;
  const encryptionSecret = await getDerivedEncryptionKey(secret, salt);
  return await new EncryptJWT(token)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(now() + maxAge)
    .setJti("some-random-id")
    .encrypt(encryptionSecret);
}
