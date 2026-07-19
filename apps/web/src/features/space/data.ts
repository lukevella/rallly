import "server-only";

import type {
  SpaceMemberRole as DBSpaceMemberRole,
  SpaceTier as DBSpaceTier,
} from "@rallly/database";
import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { MemberDTO } from "@/features/space/member/types";
import type { AuthorizedSpaceId, SpaceDTO } from "@/features/space/types";
import { fromDBRole } from "@/features/space/utils";
import { getSessionState } from "@/lib/auth";
import { isSelfHosted } from "@/lib/constants";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";

function createMemberDTO(member: {
  id: string;
  userId: string;
  spaceId: string;
  role: DBSpaceMemberRole;
  space: {
    ownerId: string;
  };
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}) {
  return {
    id: member.id,
    name: member.user.name,
    userId: member.userId,
    spaceId: member.spaceId,
    email: member.user.email,
    image: member.user.image ?? undefined,
    role: fromDBRole(member.role),
    isOwner: member.userId === member.space.ownerId,
  } satisfies MemberDTO;
}

export async function getSpaceSeatCount(spaceId: string) {
  return await prisma.spaceMember.count({
    where: {
      spaceId: spaceId,
    },
  });
}

export function createSpaceDTO(space: {
  id: string;
  ownerId: string;
  name: string;
  role: DBSpaceMemberRole;
  image?: string | null;
  tier: DBSpaceTier;
  primaryColor?: string | null;
  showBranding: boolean;
}): SpaceDTO {
  return {
    id: space.id as AuthorizedSpaceId,
    name: space.name,
    ownerId: space.ownerId,
    tier: isSelfHosted ? "pro" : space.tier,
    role: fromDBRole(space.role),
    image: space.image ?? undefined,
    primaryColor: space.primaryColor ?? undefined,
    showBranding: space.showBranding,
  };
}

export const getMember = async (id: string) => {
  const member = await prisma.spaceMember.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
      spaceId: true,
      role: true,
      space: {
        select: {
          ownerId: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  return createMemberDTO(member);
};

export function getSpaceBranding(spaceId: string) {
  return prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      name: true,
      image: true,
      showBranding: true,
      primaryColor: true,
    },
  });
}

/**
 * The active space for the signed-in user, gated for server rendering:
 * redirects to /login when unauthenticated or a guest, redirects to /setup
 * when the user has no space, and throws InvalidSessionError when banned.
 * React cached, so every page and layout that needs the space in a request
 * shares one gate and one query. Server component/page use only — the
 * redirects make it unsuitable for route handlers and tRPC procedures.
 */
export const getActiveSpace = cache(async () => {
  const state = await getSessionState();

  // An unreadable session (store unreachable, transient failure) is not
  // "logged out" — redirecting to /login on it is one leg of a redirect
  // loop. Fail the render instead so the user gets the error boundary's
  // retry page.
  if (state.status === "error") {
    throw new Error("Failed to read session");
  }

  const user =
    state.status === "authenticated" ? state.session.user : undefined;

  if (!user || user.isGuest) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  if (user.banned) {
    throw new InvalidSessionError();
  }

  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/setup",
        returnUrl: await getPathname(),
      }),
    );
  }

  return space;
});

export const getActiveSpaceForUser = cache(async (userId: string) => {
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId,
    },
    orderBy: {
      lastSelectedAt: "desc",
    },
    include: {
      space: true,
    },
  });

  if (!spaceMember) {
    return null;
  }

  return createSpaceDTO({
    ...spaceMember.space,
    role: spaceMember.role,
  });
});
