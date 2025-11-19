import type { SpaceTier } from "@rallly/database";
import { prisma } from "@rallly/database";
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

  return space;
}
