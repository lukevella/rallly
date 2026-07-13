import "server-only";

import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { defineAbilityForApiKeys } from "@/features/api-keys/ability";
import { generateApiKey } from "@/features/api-keys/utils";
import { AppError } from "@/lib/errors/app-error";
import { MAX_ACTIVE_API_KEYS_PER_SPACE } from "./schema";

async function countActiveApiKeys(spaceId: string) {
  return prisma.spaceApiKey.count({
    where: {
      spaceId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
}

export async function createApiKey({
  spaceId,
  name,
}: {
  spaceId: string;
  name: string;
}) {
  const activeCount = await countActiveApiKeys(spaceId);

  // Expected outcome the caller handles specifically, so it's part of the
  // return value; thrown errors are reserved for the global error handler.
  if (activeCount >= MAX_ACTIVE_API_KEYS_PER_SPACE) {
    return { ok: false, reason: "max_api_keys_exceeded" } as const;
  }

  const { apiKey, prefix, hashedKey } = await generateApiKey();

  await prisma.spaceApiKey.create({
    data: {
      spaceId,
      name,
      prefix,
      hashedKey,
    },
  });

  return { ok: true, apiKey } as const;
}

export async function revokeApiKey({
  spaceId,
  id,
}: {
  spaceId: string;
  id: string;
}) {
  const apiKey = await prisma.spaceApiKey.findUnique({
    where: { id },
    select: { spaceId: true, revokedAt: true },
  });

  if (!apiKey) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "API key not found",
    });
  }

  const ability = defineAbilityForApiKeys({ spaceId });

  if (ability.cannot("revoke", subject("ApiKey", apiKey))) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to revoke this API key",
    });
  }

  if (apiKey.revokedAt) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "API key is already revoked",
    });
  }

  // Guard on revokedAt so a concurrent revoke can't have both requests report
  // success (and emit duplicate lifecycle events). The loser updates 0 rows.
  const { count } = await prisma.spaceApiKey.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "API key is already revoked",
    });
  }
}
