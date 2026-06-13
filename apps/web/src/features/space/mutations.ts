import type { SpaceTier } from "@rallly/database";
import { prisma } from "@rallly/database";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { spaceBrandingTag } from "@/features/space/constants";
import { createSpaceDTO } from "@/features/space/data";
import { deleteImageFromS3 } from "@/lib/storage/image-upload";
import { isSelfHosted } from "@/utils/constants";

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

  return createSpaceDTO({ ...space, role: "ADMIN" });
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

  revalidateTag(spaceBrandingTag(spaceId), "max");
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

  revalidateTag(spaceBrandingTag(spaceId), "max");
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
  const oldImageKey = space?.image;

  await prisma.space.update({
    where: { id: spaceId },
    data: { image: imageKey },
  });

  revalidateTag(spaceBrandingTag(spaceId), "max");

  if (oldImageKey) {
    after(() => deleteImageFromS3(oldImageKey));
  }
}

export async function updateSpaceTier({
  spaceId,
  tier,
}: {
  spaceId: string;
  tier: SpaceTier;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: {
      tier,
      // custom branding is a pro feature
      ...(tier === "hobby" ? { showBranding: false } : {}),
    },
  });

  if (tier === "hobby") {
    revalidateTag(spaceBrandingTag(spaceId), "max");
  }
}
