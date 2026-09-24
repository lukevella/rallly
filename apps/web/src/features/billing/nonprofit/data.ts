import "server-only";

import { prisma } from "@rallly/database";
import type { AuthorizedSpaceId } from "@/features/space/types";

export async function getNonprofitDiscountGrantedAt(
  spaceId: AuthorizedSpaceId,
) {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { nonprofitDiscountGrantedAt: true },
  });

  return space?.nonprofitDiscountGrantedAt ?? null;
}
