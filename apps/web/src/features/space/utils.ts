import type {
  SpaceMemberRole as PrismaSpaceMemberRole,
  SpaceTier as PrismaSpaceTier,
} from "@rallly/database";
import { resolveSpaceTier } from "@/features/billing/utils";
import type { InstancePolicy } from "@/features/instance-policy/types";
import type { Industry } from "@/features/space/constants";
import {
  industryDomainRules,
  industryKeywordRules,
} from "@/features/space/constants";
import type { MemberRole } from "@/features/space/schema";
import type {
  AuthorizedSpaceId,
  SpaceContentScope,
  SpaceDTO,
} from "@/features/space/types";

export const toDBRole = (role: MemberRole): PrismaSpaceMemberRole => {
  switch (role) {
    case "member":
      return "MEMBER";
    case "admin":
      return "ADMIN";
  }
};

export const fromDBRole = (role: PrismaSpaceMemberRole): MemberRole => {
  switch (role) {
    case "MEMBER":
      return "member";
    case "ADMIN":
      return "admin";
  }
};

export function createSpaceDTO({
  space,
  policy,
}: {
  space: {
    id: string;
    ownerId: string;
    name: string;
    role: PrismaSpaceMemberRole;
    image?: string | null;
    tier: PrismaSpaceTier;
    primaryColor?: string | null;
    showBranding: boolean;
    hideAttribution: boolean;
    shared: boolean;
    memberCount: number;
    seatCount: number;
  };
  policy: Pick<InstancePolicy, "spacesAlwaysShared">;
}): SpaceDTO {
  return {
    id: space.id as AuthorizedSpaceId,
    name: space.name,
    ownerId: space.ownerId,
    tier: resolveSpaceTier(space.tier),
    role: fromDBRole(space.role),
    // Coerced at read time: migrations are shared with cloud, so the column
    // cannot be backfilled per deployment. Every reader of `shared` must go
    // through this DTO rather than the row.
    shared: policy.spacesAlwaysShared || space.shared,
    memberCount: space.memberCount,
    seatCount: space.seatCount,
    image: space.image ?? undefined,
    primaryColor: space.primaryColor ?? undefined,
    showBranding: space.showBranding,
    hideAttribution: space.hideAttribution,
  };
}

/**
 * The visibility scope space-scoped content reads must apply for this
 * member. One rule for all content types and all roles: in an unshared
 * space, reads are restricted to what the member created themselves —
 * visibility is a property of the space, while roles only grant
 * administrative capabilities (members, billing). Admins can still reach
 * everything by making the space shared, which every member can see on
 * the members page.
 */
export function createSpaceContentScope({
  space,
  userId,
}: {
  space: Pick<SpaceDTO, "id" | "shared">;
  userId: string;
}): SpaceContentScope {
  return space.shared
    ? { spaceId: space.id }
    : { spaceId: space.id, createdBy: userId };
}

/**
 * Guess a work space's sector from the owner's email domain and the
 * organization name. Domain first — a .edu address outranks any word in a
 * name — then whole-word keywords against the name. Returns undefined when
 * nothing matches: the field has no default, the user picks.
 *
 * The guess is only ever a prefill. What gets stored is what the user
 * confirms, and both values are reported to PostHog so the classifier's
 * accuracy stays measurable.
 */
export function inferIndustry({
  email,
  organizationName,
}: {
  email?: string | null;
  organizationName?: string | null;
}): Industry | undefined {
  const domain = email?.trim().toLowerCase().split("@")[1];

  if (domain) {
    // The suffix has to match end-to-end, with at least one label in front of
    // it. Matching labels individually is what let anyone claim a sector by
    // registering around one: "attacker.edu.com" and "foo.edu.attacker.com"
    // both contain the label "edu" while ending in ".com". Requiring a label
    // before the suffix also stops a bare "edu" host from matching itself.
    for (const rule of industryDomainRules) {
      if (rule.suffixes.some((suffix) => domain.endsWith(`.${suffix}`))) {
        return rule.industry;
      }
    }
  }

  const words = organizationName
    ?.toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (words?.length) {
    const wordSet = new Set(words);

    for (const rule of industryKeywordRules) {
      if (rule.keywords.some((keyword) => wordSet.has(keyword))) {
        return rule.industry;
      }
    }
  }

  return undefined;
}
