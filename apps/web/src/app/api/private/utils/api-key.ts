import crypto from "node:crypto";
import { prisma } from "@rallly/database";
import { waitUntil } from "@vercel/functions";
import { bearerAuth } from "hono/bearer-auth";

const extractApiKeyPrefix = (rawKey: string) => {
  const parts = rawKey.split("_").filter(Boolean);
  if (parts.length >= 3 && parts[1]) {
    return parts[1];
  }
  return rawKey.slice(0, 12);
};

const isHexSha256 = (value: string) => /^[a-f0-9]{64}$/i.test(value);

const hashApiKey = (rawKey: string, salt?: string) => {
  const input = salt ? `${salt}:${rawKey}` : rawKey;
  return crypto.createHash("sha256").update(input).digest("hex");
};

const verifyApiKey = (rawKey: string, stored: string) => {
  const trimmed = stored.trim();
  if (trimmed.startsWith("sha256$")) {
    const [, salt, hash] = trimmed.split("$");
    if (!salt || !hash || !isHexSha256(hash)) {
      return false;
    }
    const computed = hashApiKey(rawKey, salt);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }

  if (!isHexSha256(trimmed)) {
    return false;
  }

  const computed = hashApiKey(rawKey);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(trimmed));
};

export const apiKeyAuth = bearerAuth({
  verifyToken: async (rawKey, c) => {
    const prefix = extractApiKeyPrefix(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { prefix },
      select: {
        id: true,
        userId: true,
        hashedKey: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!apiKey) {
      return false;
    }

    if (apiKey.revokedAt) {
      return false;
    }

    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
      return false;
    }

    if (!verifyApiKey(rawKey, apiKey.hashedKey)) {
      return false;
    }

    c.set("apiAuth", {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
    });

    waitUntil(
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }),
    );

    return true;
  },
});
