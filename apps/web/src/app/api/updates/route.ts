import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";
import * as z from "zod";
import { getMajorVersion } from "@/features/instance-settings/utils";
import { createCache } from "@/lib/cache";
import { isSelfHosted } from "@/lib/constants";
import { createRatelimit } from "@/lib/rate-limit";
import type { ReleaseChannels } from "./release-channels";
import { buildReleaseChannels } from "./release-channels";

const logger = createLogger("api/updates");

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/lukevella/rallly/releases?per_page=100";

// The fleet starts linking here the moment a new major's first release is
// tagged — the guide must be published at this path before tagging.
function getMigrationGuideUrl(major: number) {
  return `https://support.rallly.co/self-hosting/migrate-to-v${major}`;
}

type UpdatesPayload = {
  latest: string | null;
  url: string | null;
  publishedAt: string | null;
  newMajor?: {
    version: string;
    migrationGuideUrl: string;
  };
};

const releaseChannelsCache = createCache<ReleaseChannels>({
  namespace: "updates:release-channels",
  ttl: "1 h",
});

const seenInstanceCache = createCache<string>({
  namespace: "updates:seen-instance",
  ttl: "1 d",
});

const ratelimit = createRatelimit(60, "1 h");

async function fetchReleaseChannels(): Promise<ReleaseChannels | null> {
  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Rallly",
      },
      // Just under the self-hosted client's 3s budget so a slow GitHub
      // response still yields our controlled 502 instead of a hung slot
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;

    return buildReleaseChannels(await res.json());
  } catch (error) {
    logger.warn({ error }, "Failed to fetch releases from GitHub");
    return null;
  }
}

async function getReleaseChannels(): Promise<ReleaseChannels | null> {
  const cached = await releaseChannelsCache.get("channels");
  if (cached) return cached;

  const fresh = await fetchReleaseChannels();
  if (fresh) await releaseChannelsCache.set("channels", fresh);
  return fresh;
}

function buildPayload(
  channels: ReleaseChannels,
  requestedMajor: number | null,
): UpdatesPayload {
  const latestRelease = channels.latestByMajor[channels.latestMajor];

  if (requestedMajor === null) {
    return {
      latest: latestRelease.version,
      url: latestRelease.url,
      publishedAt: latestRelease.publishedAt,
    };
  }

  const ownChannel = channels.latestByMajor[requestedMajor];

  return {
    latest: ownChannel?.version ?? null,
    url: ownChannel?.url ?? null,
    publishedAt: ownChannel?.publishedAt ?? null,
    ...(channels.latestMajor > requestedMajor
      ? {
          newMajor: {
            version: latestRelease.version,
            migrationGuideUrl: getMigrationGuideUrl(channels.latestMajor),
          },
        }
      : {}),
  };
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

  const channels = await getReleaseChannels();

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

  const requestedMajor = parsedVersion.success
    ? getMajorVersion(parsedVersion.data)
    : null;

  return NextResponse.json(buildPayload(channels, requestedMajor));
}
