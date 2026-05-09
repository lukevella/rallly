import { RedisStore } from "@hono-rate-limiter/redis";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import * as z from "zod";
import { redis } from "../lib/redis";
import { apiError } from "../utils/error";

const logger = createLogger("api/routes/updates");

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

const versionSchema = z
  .string()
  .max(64)
  .regex(/^v?\d+(\.\d+){0,2}([-+][0-9A-Za-z.-]+)?$/);
const instanceIdSchema = z.uuid();

const LATEST_RELEASE_KEY = "updates:latest-release:latest";
const LATEST_RELEASE_TTL_SECONDS = 60 * 60;
const SEEN_INSTANCE_TTL_SECONDS = 60 * 60 * 24;
const seenInstanceKey = (instanceId: string) =>
  `updates:seen-instance:${instanceId}`;

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
  if (redis) {
    const cached = await redis.get<UpdatesPayload>(LATEST_RELEASE_KEY);
    if (cached) return cached;
  }

  const fresh = await fetchLatestRelease();
  if (fresh && redis) {
    await redis.set(LATEST_RELEASE_KEY, fresh, {
      ex: LATEST_RELEASE_TTL_SECONDS,
    });
  }
  return fresh;
}

async function recordSeenInstance(instanceId: string, version: string) {
  if (redis) {
    const cachedVersion = await redis.get<string>(seenInstanceKey(instanceId));
    if (cachedVersion === version) return;
  }

  await prisma.registeredInstance.upsert({
    where: { instanceId },
    create: { instanceId, version },
    update: { version, lastSeenAt: new Date() },
  });

  if (redis) {
    await redis.set(seenInstanceKey(instanceId), version, {
      ex: SEEN_INSTANCE_TTL_SECONDS,
    });
  }
}

export const updates = new Hono();

updates.get(
  "/",
  rateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 60,
    keyGenerator: (c) => {
      const ip =
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      return `updates:rate-limit:${ip}`;
    },
    store: redis ? new RedisStore({ client: redis }) : undefined,
  }),
  async (c) => {
    const payload = await getLatestRelease();

    if (!payload) {
      return c.json(
        apiError("UPSTREAM_UNAVAILABLE", "Upstream is unavailable."),
        502,
      );
    }

    const parsedVersion = versionSchema.safeParse(c.req.query("version"));
    const parsedInstanceId = instanceIdSchema.safeParse(
      c.req.query("instanceId"),
    );

    if (parsedVersion.success && parsedInstanceId.success) {
      void recordSeenInstance(parsedInstanceId.data, parsedVersion.data).catch(
        (error) =>
          logger.error({ error }, "Failed to upsert RegisteredInstance"),
      );
    }

    return c.json(payload);
  },
);
