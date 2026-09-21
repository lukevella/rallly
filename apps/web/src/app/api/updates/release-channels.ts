import * as z from "zod";
import {
  getMajorVersion,
  isOutdated,
} from "@/features/instance-settings/utils";
import type { SecurityAdvisory } from "./security-advisories";
import { isVulnerable } from "./security-advisories";

const releaseSchema = z.object({
  tag_name: z.string().min(1),
  html_url: z.string().min(1),
  published_at: z.string().nullish(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional(),
});

const STABLE_TAG_REGEX = /^v?\d+\.\d+\.\d+$/;

export type ReleaseInfo = {
  version: string;
  url: string;
  publishedAt: string;
};

export type ReleaseChannels = {
  latestByMajor: Record<number, ReleaseInfo>;
  latestMajor: number;
};

export type UpdatesPayload = {
  latest: string | null;
  url: string | null;
  publishedAt: string | null;
  security: boolean;
  newMajor?: {
    version: string;
    migrationGuideUrl: string;
    security: boolean;
  };
};

// The fleet starts linking here the moment a new major's first release is
// tagged — the guide must be published at this path before tagging.
function getMigrationGuideUrl(major: number) {
  return `https://support.rallly.co/self-hosting/migrate-to-v${major}`;
}

export function buildReleaseChannels(input: unknown): ReleaseChannels | null {
  if (!Array.isArray(input)) return null;

  const latestByMajor: Record<number, ReleaseInfo> = {};

  for (const item of input) {
    const parsed = releaseSchema.safeParse(item);
    if (!parsed.success) continue;

    const { tag_name, html_url, published_at, draft, prerelease } = parsed.data;
    if (draft || prerelease || !published_at) continue;
    if (!STABLE_TAG_REGEX.test(tag_name)) continue;

    const major = getMajorVersion(tag_name);
    if (major === null) continue;

    const current = latestByMajor[major];
    if (!current || isOutdated(current.version, tag_name)) {
      latestByMajor[major] = {
        version: tag_name,
        url: html_url,
        publishedAt: published_at,
      };
    }
  }

  const majors = Object.keys(latestByMajor).map(Number);
  if (majors.length === 0) return null;

  return { latestByMajor, latestMajor: Math.max(...majors) };
}

export function buildUpdatesPayload({
  channels,
  advisories,
  requestedVersion,
}: {
  channels: ReleaseChannels;
  advisories: SecurityAdvisory[];
  requestedVersion: string | null;
}): UpdatesPayload {
  const latestRelease = channels.latestByMajor[channels.latestMajor];
  const requestedMajor =
    requestedVersion === null ? null : getMajorVersion(requestedVersion);

  if (requestedVersion === null || requestedMajor === null) {
    return {
      latest: latestRelease.version,
      url: latestRelease.url,
      publishedAt: latestRelease.publishedAt,
      security: false,
    };
  }

  const ownChannel = channels.latestByMajor[requestedMajor];

  // Severity comes from the advisories' version ranges, so it is exact for
  // the caller: an advisory the caller falls inside is fixed by the channel
  // update when the channel's latest falls outside it, and only by the new
  // major when the channel's latest is still inside it.
  const open = advisories.filter((advisory) =>
    isVulnerable(requestedVersion, advisory),
  );
  const fixedInChannel = (advisory: SecurityAdvisory) =>
    !!ownChannel && !isVulnerable(ownChannel.version, advisory);
  const fixedInLatest = (advisory: SecurityAdvisory) =>
    !isVulnerable(latestRelease.version, advisory);

  const security = open.some(fixedInChannel);
  const newMajorSecurity = open.some(
    (advisory) => !fixedInChannel(advisory) && fixedInLatest(advisory),
  );

  return {
    latest: ownChannel?.version ?? null,
    url: ownChannel?.url ?? null,
    publishedAt: ownChannel?.publishedAt ?? null,
    security,
    ...(channels.latestMajor > requestedMajor
      ? {
          newMajor: {
            version: latestRelease.version,
            migrationGuideUrl: getMigrationGuideUrl(channels.latestMajor),
            security: newMajorSecurity,
          },
        }
      : {}),
  };
}
