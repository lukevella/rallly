import "server-only";

import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { defineAbilityForApiKeys } from "@/features/api-keys/ability";
import { createApiKey as generateApiKey } from "@/features/api-keys/utils";
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

  if (activeCount >= MAX_ACTIVE_API_KEYS_PER_SPACE) {
    throw new AppError({
      code: "TOO_MANY_REQUESTS",
      message: `You can have at most ${MAX_ACTIVE_API_KEYS_PER_SPACE} active API keys. Revoke one before creating another.`,
    });
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

  return { apiKey };
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

  await prisma.spaceApiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}
