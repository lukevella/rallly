import { prisma } from "@rallly/database";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";
import * as z from "zod";
import { createCache } from "@/lib/cache";
import { createRatelimit } from "@/lib/rate-limit";
import { isSelfHosted } from "@/utils/constants";

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/lukevella/rallly/releases/latest";

const upstreamSchema = z.object({
  tag_name: z.string().min(1),
  html_url: z.string().min(1),
  published_at: z.string().min(1),
});

type UpdatesPayload = {
  latest: string;
  url: string;
  publishedAt: string;
};

const latestReleaseCache = createCache<UpdatesPayload>({
  namespace: "updates:latest-release",
  ttl: "1 h",
});

const seenInstanceCache = createCache<string>({
  namespace: "updates:seen-instance",
  ttl: "1 d",
});

const ratelimit = createRatelimit(60, "1 h");

async function fetchLatestRelease(): Promise<UpdatesPayload | null> {
  const res = await fetch(GITHUB_RELEASES_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Rallly",
    },
  });
  if (!res.ok) return null;

  const parsed = upstreamSchema.safeParse(await res.json());
  if (!parsed.success) return null;

  return {
    latest: parsed.data.tag_name,
    url: parsed.data.html_url,
    publishedAt: parsed.data.published_at,
  };
}

async function getLatestRelease(): Promise<UpdatesPayload | null> {
  const cached = await latestReleaseCache.get("latest");
  if (cached) return cached;

  const fresh = await fetchLatestRelease();
  if (fresh) await latestReleaseCache.set("latest", fresh);
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

  const payload = await getLatestRelease();

  if (!payload) {
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
        console.error("Failed to upsert RegisteredInstance", error);
      }
    });
  }

  return NextResponse.json(payload);
}
