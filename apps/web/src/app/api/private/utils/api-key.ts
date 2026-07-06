import crypto from "node:crypto";
import { prisma } from "@rallly/database";
import { bearerAuth } from "hono/bearer-auth";
import { after } from "next/server";
import {
  extractApiKeyPrefix,
  hashApiKey,
  isLegacyApiKeyHash,
  verifyApiKey,
} from "@/features/api-keys/api-key";

export const spaceApiKeyAuth = bearerAuth({
  verifyToken: async (rawKey, c) => {
    const prefix = extractApiKeyPrefix(rawKey);
    const prefixBuffer = Buffer.from(prefix);

    // Query candidate keys to avoid timing attack via database lookup
    // We use a partial prefix match to narrow the search space
    const now = new Date();
    const candidateKeys = await prisma.spaceApiKey.findMany({
      where: {
        prefix: {
          startsWith: prefix.slice(0, Math.min(4, prefix.length)),
        },
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        prefix: true,
        spaceId: true,
        hashedKey: true,
        expiresAt: true,
        revokedAt: true,
        space: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    let apiKeyId: string | null = null;
    let spaceId: string | null = null;
    let spaceOwnerId: string | null = null;
    let needsRehash = false;
    for (const candidate of candidateKeys) {
      // Timing-safe prefix comparison
      const candidateBuffer = Buffer.from(candidate.prefix);
      if (
        prefixBuffer.length === candidateBuffer.length &&
        crypto.timingSafeEqual(prefixBuffer, candidateBuffer)
      ) {
        // Verify the full key hash
        const isValid = await verifyApiKey(rawKey, candidate.hashedKey);
        if (isValid) {
          apiKeyId = candidate.id;
          spaceId = candidate.spaceId;
          spaceOwnerId = candidate.space.ownerId;
          needsRehash = isLegacyApiKeyHash(candidate.hashedKey);
        }
      }
    }

    if (!apiKeyId || !spaceId || !spaceOwnerId) {
      return false;
    }

    c.set("apiAuth", {
      spaceId,
      spaceOwnerId,
      apiKeyId,
    });

    // Lazily migrate deprecated scrypt hashes to sha256 — we only hold the
    // raw key during verification, so this is the one place we can re-hash.
    const rehashedKey = needsRehash ? hashApiKey(rawKey) : null;

    after(() =>
      prisma.spaceApiKey.update({
        where: { id: apiKeyId },
        data: {
          lastUsedAt: new Date(),
          ...(rehashedKey ? { hashedKey: rehashedKey } : {}),
        },
      }),
    );

    return true;
  },
});
