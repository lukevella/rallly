import "server-only";

import type { SpaceTier, SpaceType } from "@rallly/database";
import { prisma } from "@rallly/database";
import { after } from "next/server";
import { resolveSpaceTier } from "@/features/billing/utils";
import { getInstancePolicy } from "@/features/instance-policy/data";
import { createSpaceDTO } from "@/features/space/utils";
import {
  deleteStoredAsset,
  replaceStoredAsset,
} from "@/lib/storage/asset-upload";

export async function createSpace({
  name = "Personal",
  ownerId,
  // Stored as what reads resolve an unpaid space to, so the row matches
  // behavior on instances without billing
  tier = resolveSpaceTier("hobby"),
  spaceType,
  industry,
}: {
  name?: string;
  ownerId: string;
  tier?: SpaceTier;
  spaceType?: SpaceType;
  industry?: string | null;
}) {
  const policy = await getInstancePolicy();

  const space = await prisma.space.create({
    data: {
      name,
      ownerId,
      tier,
      spaceType,
      industry,
      // New spaces start unshared; sharing everything is opt-in. Matches
      // the column default — explicit here so the decision is visible in
      // code, not just the schema. Stored as shared where the policy forces
      // it so the row matches what reads coerce it to.
      shared: policy.spacesAlwaysShared,
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
    space: {
      ...space,
      role: "ADMIN",
      memberCount: 1,
      seatCount: 1,
    },
    policy,
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

export async function updateSpaceShared({
  spaceId,
  shared,
}: {
  spaceId: string;
  shared: boolean;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: { shared },
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
