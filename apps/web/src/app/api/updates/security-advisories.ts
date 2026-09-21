import * as z from "zod";
import { isOutdated } from "@/features/instance-settings/utils";

const advisorySchema = z.object({
  ghsa_id: z.string().min(1),
  html_url: z.string().min(1),
  severity: z.string().nullish(),
  published_at: z.string().nullish(),
  vulnerabilities: z
    .array(z.object({ vulnerable_version_range: z.string().nullish() }))
    .optional(),
});

type Comparator = {
  operator: "<" | "<=" | ">" | ">=" | "=";
  version: string;
};

export type SecurityAdvisory = {
  ghsaId: string;
  url: string;
  severity: string | null;
  ranges: Comparator[][];
};

const COMPARATOR_REGEX = /^(<=|>=|<|>|=)?\s*v?(\d+(?:\.\d+){0,2})$/;

// GitHub's range syntax: comparators separated by commas or spaces, all of
// which must hold ("< 4.12.0", ">= 4.0.0, < 4.13.1", "<=3.11.2"). A range that
// does not parse yields null so a malformed advisory cannot match everyone.
export function parseVersionRange(range: string): Comparator[] | null {
  // Insert a separator between an operand and the next operator so
  // ">= 4.0.0 < 4.13.1" splits the same as ">= 4.0.0, < 4.13.1"
  const tokens = range
    .trim()
    .replace(/(\d)\s+(?=[<>=])/g, "$1,")
    .split(/\s*,\s*/)
    .filter(Boolean);
  if (tokens.length === 0) return null;

  const comparators: Comparator[] = [];
  for (const token of tokens) {
    const match = COMPARATOR_REGEX.exec(token);
    if (!match) return null;
    comparators.push({
      operator: (match[1] as Comparator["operator"] | undefined) ?? "=",
      version: match[2],
    });
  }
  return comparators;
}

function compare(a: string, b: string) {
  if (isOutdated(a, b)) return -1;
  if (isOutdated(b, a)) return 1;
  return 0;
}

function satisfies(version: string, comparators: Comparator[]) {
  return comparators.every(({ operator, version: bound }) => {
    const c = compare(version, bound);
    switch (operator) {
      case "<":
        return c < 0;
      case "<=":
        return c <= 0;
      case ">":
        return c > 0;
      case ">=":
        return c >= 0;
      default:
        return c === 0;
    }
  });
}

export function isVulnerable(version: string, advisory: SecurityAdvisory) {
  return advisory.ranges.some((range) => satisfies(version, range));
}

export function buildSecurityAdvisories(input: unknown): SecurityAdvisory[] {
  if (!Array.isArray(input)) return [];

  const advisories: SecurityAdvisory[] = [];
  for (const item of input) {
    const parsed = advisorySchema.safeParse(item);
    if (!parsed.success) continue;

    const { ghsa_id, html_url, severity, vulnerabilities } = parsed.data;
    const ranges = (vulnerabilities ?? [])
      .map((v) => v.vulnerable_version_range)
      .filter((r): r is string => !!r)
      .map(parseVersionRange)
      .filter((r): r is Comparator[] => r !== null);
    if (ranges.length === 0) continue;

    advisories.push({
      ghsaId: ghsa_id,
      url: html_url,
      severity: severity ?? null,
      ranges,
    });
  }
  return advisories;
}
