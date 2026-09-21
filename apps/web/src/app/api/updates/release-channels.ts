import * as z from "zod";
import {
  getMajorVersion,
  isOutdated,
} from "@/features/instance-settings/utils";

const releaseSchema = z.object({
  tag_name: z.string().min(1),
  html_url: z.string().min(1),
  published_at: z.string().nullish(),
  body: z.string().nullish(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional(),
});

const STABLE_TAG_REGEX = /^v?\d+\.\d+\.\d+$/;

// A release is a security release when its notes carry a heading that says
// so ("## 🔒 Security release"). The heading is the publishing convention;
// flagging a release needs no code change and applies to releases already
// published.
const SECURITY_HEADING_REGEX = /^#{1,6}[^\S\n]*.*\bsecurity release\b/im;

// A security release reaches operators on older majors only when its notes
// say so ("Affected versions: 4.x, 5.x"). Without the line it flags its own
// major alone, so a fix for a bug introduced in v5 never alarms v4.
const AFFECTED_VERSIONS_REGEX = /^affected versions?:[^\S\n]*(.+)$/im;

export type ReleaseInfo = {
  version: string;
  url: string;
  publishedAt: string;
};

export type SecurityRelease = ReleaseInfo & {
  affectedMajors: number[];
};

export type ReleaseChannels = {
  latestByMajor: Record<number, ReleaseInfo>;
  latestMajor: number;
  securityReleases: SecurityRelease[];
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

export function isSecurityRelease(body: string | null | undefined) {
  return !!body && SECURITY_HEADING_REGEX.test(body);
}

export function parseAffectedMajors(body: string | null | undefined) {
  const line = body?.match(AFFECTED_VERSIONS_REGEX)?.[1];
  if (!line) return [];
  return [
    ...new Set(
      [...line.matchAll(/\bv?(\d+)(?:\.\S*)?/g)].map((m) => Number(m[1])),
    ),
  ];
}

export function buildReleaseChannels(input: unknown): ReleaseChannels | null {
  if (!Array.isArray(input)) return null;

  const latestByMajor: Record<number, ReleaseInfo> = {};
  const securityReleases: SecurityRelease[] = [];

  for (const item of input) {
    const parsed = releaseSchema.safeParse(item);
    if (!parsed.success) continue;

    const { tag_name, html_url, published_at, body, draft, prerelease } =
      parsed.data;
    if (draft || prerelease || !published_at) continue;
    if (!STABLE_TAG_REGEX.test(tag_name)) continue;

    const major = getMajorVersion(tag_name);
    if (major === null) continue;

    const info: ReleaseInfo = {
      version: tag_name,
      url: html_url,
      publishedAt: published_at,
    };

    const current = latestByMajor[major];
    if (!current || isOutdated(current.version, tag_name)) {
      latestByMajor[major] = info;
    }

    if (isSecurityRelease(body)) {
      securityReleases.push({
        ...info,
        affectedMajors: [...new Set([major, ...parseAffectedMajors(body)])],
      });
    }
  }

  const majors = Object.keys(latestByMajor).map(Number);
  if (majors.length === 0) return null;

  return { latestByMajor, latestMajor: Math.max(...majors), securityReleases };
}

export function buildUpdatesPayload(
  channels: ReleaseChannels,
  requestedVersion: string | null,
): UpdatesPayload {
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

  // Severity is relative to the caller, not a property of the latest
  // release: an instance two patches behind a security fix is exposed even
  // when the newest release is a copy change.
  const security = channels.securityReleases.some(
    (release) =>
      getMajorVersion(release.version) === requestedMajor &&
      isOutdated(requestedVersion, release.version),
  );

  // A security release in a newer major matters only when its notes list the
  // caller's major as affected and the caller's channel has had no security
  // release since — once a backport ships, the within-channel flag takes over.
  const newMajorSecurity = channels.securityReleases.some((release) => {
    const major = getMajorVersion(release.version);
    if (major === null || major <= requestedMajor) return false;
    if (!release.affectedMajors.includes(requestedMajor)) return false;
    return !channels.securityReleases.some(
      (other) =>
        getMajorVersion(other.version) === requestedMajor &&
        other.publishedAt >= release.publishedAt,
    );
  });

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
