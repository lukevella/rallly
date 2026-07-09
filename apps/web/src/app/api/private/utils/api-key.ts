import crypto from "node:crypto";
import type { SpaceTier } from "@rallly/database";
import { prisma } from "@rallly/database";
import { bearerAuth } from "hono/bearer-auth";
import { every } from "hono/combine";
import { createMiddleware } from "hono/factory";
import { after } from "next/server";
import {
  extractApiKeyPrefix,
  hashApiKey,
  isLegacyApiKeyHash,
  verifyApiKey,
} from "@/features/api-keys/api-key";
import { isSelfHosted } from "@/lib/constants";
import { apiError } from "./poll";

const LAST_USED_AT_WRITE_INTERVAL_MS = 60_000;

const verifyKey = bearerAuth({
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
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        space: {
          select: {
            ownerId: true,
            tier: true,
          },
        },
      },
    });

    let apiKeyId: string | null = null;
    let spaceId: string | null = null;
    let spaceOwnerId: string | null = null;
    let spaceTier: SpaceTier | null = null;
    let lastUsedAt: Date | null = null;
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
          spaceTier = candidate.space.tier;
          lastUsedAt = candidate.lastUsedAt;
          needsRehash = isLegacyApiKeyHash(candidate.hashedKey);
        }
      }
    }

    if (!apiKeyId || !spaceId || !spaceOwnerId || !spaceTier) {
      return false;
    }

    c.set("apiAuth", {
      spaceId,
      spaceOwnerId,
      spaceTier: isSelfHosted ? ("pro" as const) : spaceTier,
      apiKeyId,
    });

    // Lazily migrate deprecated scrypt hashes to sha256 — we only hold the
    // raw key during verification, so this is the one place we can re-hash.
    const rehashedKey = needsRehash ? hashApiKey(rawKey) : null;

    // lastUsedAt is only read at coarse precision, so throttle the write
    // rather than issue an UPDATE on every request. Concurrent requests
    // racing past this check are harmless (the write is idempotent).
    const isLastUsedAtStale =
      !lastUsedAt ||
      now.getTime() - lastUsedAt.getTime() > LAST_USED_AT_WRITE_INTERVAL_MS;

    if (rehashedKey || isLastUsedAtStale) {
      after(() =>
        prisma.spaceApiKey.update({
          where: { id: apiKeyId },
          data: {
            lastUsedAt: new Date(),
            ...(rehashedKey ? { hashedKey: rehashedKey } : {}),
          },
        }),
      );
    }

    return true;
  },
});

// hono/bearer-auth can only turn a failed verifyToken into a 401, so the
// tier check runs as a follow-up middleware to respond with a 403 instead.
const requireProSpace = createMiddleware<{
  Variables: { apiAuth: { spaceTier: SpaceTier } };
}>(async (c, next) => {
  if (c.get("apiAuth").spaceTier !== "pro") {
    return c.json(
      apiError(
        "SPACE_NOT_PRO",
        "API access requires a Pro subscription. Upgrade this space in Settings > Billing.",
      ),
      403,
    );
  }
  await next();
});

export const spaceApiKeyAuth = every(verifyKey, requireProSpace);
