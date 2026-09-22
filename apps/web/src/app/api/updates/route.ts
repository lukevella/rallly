import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";
import * as z from "zod";
import { createCache } from "@/lib/cache";
import { githubRepo, isSelfHosted } from "@/lib/constants";
import { createRatelimit } from "@/lib/rate-limit";
import type { ReleaseChannels } from "./release-channels";
import { buildReleaseChannels, buildUpdatesPayload } from "./release-channels";
import type { SecurityAdvisory } from "./security-advisories";
import { buildSecurityAdvisories } from "./security-advisories";

const logger = createLogger("api/updates");

const GITHUB_RELEASES_URL = `https://api.github.com/repos/${githubRepo}/releases`;
const GITHUB_ADVISORIES_URL = `https://api.github.com/repos/${githubRepo}/security-advisories`;
const RELEASES_PER_PAGE = 100;
// Sequential unauthenticated requests count against a 60/hour IP budget, so
// pagination is bounded; older majors beyond this window report no update.
const MAX_RELEASE_PAGES = 3;

const releaseChannelsCache = createCache<ReleaseChannels>({
  namespace: "updates:release-channels",
  ttl: "1 h",
});

const advisoriesCache = createCache<SecurityAdvisory[]>({
  namespace: "updates:advisories",
  ttl: "1 h",
});

const seenInstanceCache = createCache<string>({
  namespace: "updates:seen-instance",
  ttl: "1 d",
});

const ratelimit = createRatelimit(60, "1 h");

async function fetchReleaseChannels(): Promise<ReleaseChannels | null> {
  try {
    // One deadline for the whole pagination, just under the self-hosted
    // client's 3s budget so a slow GitHub response still yields our
    // controlled 502 instead of a hung slot
    const signal = AbortSignal.timeout(2500);
    const releases: unknown[] = [];

    for (let page = 1; page <= MAX_RELEASE_PAGES; page++) {
      const res = await fetch(
        `${GITHUB_RELEASES_URL}?per_page=${RELEASES_PER_PAGE}&page=${page}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "Rallly",
          },
          signal,
        },
      );
      if (!res.ok) return null;

      const batch = await res.json();
      if (!Array.isArray(batch)) return null;

      releases.push(...batch);
      if (batch.length < RELEASES_PER_PAGE) break;
      if (page === MAX_RELEASE_PAGES) {
        logger.warn(
          { pages: MAX_RELEASE_PAGES },
          "Release list truncated at the pagination bound",
        );
      }
    }

    return buildReleaseChannels(releases);
  } catch (error) {
    logger.warn({ error }, "Failed to fetch releases from GitHub");
    return null;
  }
}

// Advisories are the severity source: a repository advisory's vulnerable
// version range decides which callers get the security flag. A failed fetch
// degrades to no severity rather than failing the update check.
async function fetchSecurityAdvisories(): Promise<SecurityAdvisory[] | null> {
  try {
    const signal = AbortSignal.timeout(2500);
    const advisories: unknown[] = [];
    // Cursor pagination: the next page is only known from the Link header
    let url: string | null =
      `${GITHUB_ADVISORIES_URL}?state=published&per_page=${RELEASES_PER_PAGE}`;

    for (let page = 1; url && page <= MAX_RELEASE_PAGES; page++) {
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Rallly",
        },
        signal,
      });
      if (!res.ok) return null;

      const batch = await res.json();
      if (!Array.isArray(batch)) return null;

      advisories.push(...batch);
      url = getNextLink(res.headers.get("link"));
      if (url && page === MAX_RELEASE_PAGES) {
        logger.warn(
          { pages: MAX_RELEASE_PAGES },
          "Advisory list truncated at the pagination bound",
        );
      }
    }

    return buildSecurityAdvisories(advisories);
  } catch (error) {
    logger.warn({ error }, "Failed to fetch security advisories from GitHub");
    return null;
  }
}

function getNextLink(header: string | null) {
  return header?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
}

async function getSecurityAdvisories(): Promise<SecurityAdvisory[]> {
  const cached = await advisoriesCache.get("advisories");
  if (cached) return cached;

  const fresh = await fetchSecurityAdvisories();
  if (fresh) await advisoriesCache.set("advisories", fresh);
  return fresh ?? [];
}

async function getReleaseChannels(): Promise<ReleaseChannels | null> {
  const cached = await releaseChannelsCache.get("channels");
  if (cached) return cached;

  const fresh = await fetchReleaseChannels();
  if (fresh) await releaseChannelsCache.set("channels", fresh);
  return fresh;
}

export async function GET(request: NextRequest) {
  if (isSelfHosted) {
    return new NextResponse(null, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const limitKey = ip || "unknown";
  if (ratelimit) {
    const { success } = await ratelimit.limit(`api:updates:${limitKey}`);
    if (!success) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  const [channels, advisories] = await Promise.all([
    getReleaseChannels(),
    getSecurityAdvisories(),
  ]);

  if (!channels) {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 502 },
    );
  }

  const version = request.nextUrl.searchParams.get("version");
  const instanceId = request.nextUrl.searchParams.get("instanceId");
  const parsedVersion = z
    .string()
    .max(64)
    .regex(/^v?\d+(\.\d+){0,2}([-+][0-9A-Za-z.-]+)?$/)
    .safeParse(version);
  const parsedInstanceId = z.uuid().safeParse(instanceId);

  if (parsedVersion.success && parsedInstanceId.success) {
    const validVersion = parsedVersion.data;
    const validInstanceId = parsedInstanceId.data;
    after(async () => {
      try {
        const cachedVersion = await seenInstanceCache.get(validInstanceId);
        if (cachedVersion === validVersion) return;

        await prisma.registeredInstance.upsert({
          where: { instanceId: validInstanceId },
          create: { instanceId: validInstanceId, version: validVersion },
          update: { version: validVersion, lastSeenAt: new Date() },
        });
        await seenInstanceCache.set(validInstanceId, validVersion);
      } catch (error) {
        logger.error(
          { error, instanceId: validInstanceId, version: validVersion },
          "Failed to upsert RegisteredInstance",
        );
      }
    });
  }

  return NextResponse.json(
    buildUpdatesPayload({
      channels,
      advisories,
      requestedVersion: parsedVersion.success ? parsedVersion.data : null,
    }),
  );
}
