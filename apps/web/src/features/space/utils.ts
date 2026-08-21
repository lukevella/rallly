import type { SpaceMemberRole as PrismaSpaceMemberRole } from "@rallly/database";
import type { Industry } from "@/features/space/constants";
import {
  industries,
  industryDomainRules,
  industryKeywordRules,
} from "@/features/space/constants";
import type { MemberRole } from "@/features/space/schema";

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

/**
 * Narrow a stored industry to the current taxonomy. The column is a plain
 * string so the list can change without a migration, which means a row can
 * hold a value that no longer exists — treat that as unanswered rather than
 * rendering a select with a value it has no option for.
 */
export function parseIndustry(value?: string | null): Industry | undefined {
  return industries.find((industry) => industry === value);
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
    // Everything after the leftmost label: "example.edu" -> ["edu"],
    // "dept.cam.ac.uk" -> ["cam", "ac", "uk"]. Dropping the first label
    // stops an organization that happens to be called "edu" or "gov" from
    // classifying itself.
    const labels = new Set(domain.split(".").slice(1));

    for (const rule of industryDomainRules) {
      if (rule.labels.some((label) => labels.has(label))) {
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
