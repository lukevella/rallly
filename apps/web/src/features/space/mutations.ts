import "server-only";

import type { SpaceTier } from "@rallly/database";
import { prisma } from "@rallly/database";
import { after } from "next/server";
import { createSpaceDTO } from "@/features/space/data";
import { isSelfHosted } from "@/lib/constants";
import {
  deleteStoredAsset,
  replaceStoredAsset,
} from "@/lib/storage/asset-upload";

export async function createSpace({
  name = "Personal",
  ownerId,
  tier = isSelfHosted ? "pro" : "hobby",
}: {
  name?: string;
  ownerId: string;
  tier?: SpaceTier;
}) {
  const space = await prisma.space.create({
    data: {
      name,
      ownerId,
      tier,
      members: {
        create: {
          userId: ownerId,
          role: "ADMIN",
          lastSelectedAt: new Date(),
        },
      },
    },
  });

  return createSpaceDTO({
    ...space,
    role: "ADMIN",
    memberCount: 1,
    seatCount: 1,
  });
}

export async function updateSpace({
  spaceId,
  name,
  primaryColor,
}: {
  spaceId: string;
  name?: string;
  primaryColor?: string | null;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: {
      ...(name !== undefined && { name }),
      ...(primaryColor !== undefined && { primaryColor }),
    },
  });
}

export async function updateSpaceShowBranding({
  spaceId,
  showBranding,
}: {
  spaceId: string;
  showBranding: boolean;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: { showBranding },
  });
}

export async function updateSpaceHideAttribution({
  spaceId,
  hideAttribution,
}: {
  spaceId: string;
  hideAttribution: boolean;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: { hideAttribution },
  });
}

export async function updateSpaceImage({
  spaceId,
  imageKey,
}: {
  spaceId: string;
  imageKey: string | null;
}) {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { image: true },
  });

  await replaceStoredAsset({
    currentKey: space?.image,
    nextKey: imageKey,
    persist: async () => {
      await prisma.space.update({
        where: { id: spaceId },
        data: { image: imageKey },
      });
    },
  });
}

export async function deleteSpace({ spaceId }: { spaceId: string }) {
  const deletedSpace = await prisma.space.delete({
    where: { id: spaceId },
  });

  const imageKey = deletedSpace.image;

  if (imageKey) {
    after(() => deleteStoredAsset(imageKey));
  }
}
