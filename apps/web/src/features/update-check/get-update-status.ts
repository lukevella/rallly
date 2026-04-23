import "server-only";

import { prisma } from "@rallly/database";
import * as z from "zod";
import { env } from "@/env";
import { appVersion, isSelfHosted } from "@/utils/constants";
import { isNewer } from "./is-newer";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

type CachedResponse = {
  latest: string;
  url: string;
  fetchedAt: number;
};

const upstreamResponseSchema = z.object({
  latest: z.string().min(1),
  url: z.string().min(1),
});

export type UpdateStatus =
  | { checkDisabled: true }
  | {
      checkDisabled: false;
      currentVersion: string | undefined;
      latestVersion: string | null;
      updateAvailable: boolean;
      releaseUrl: string | null;
    };

let cache: CachedResponse | null = null;
let inFlight: Promise<void> | null = null;

async function getInstanceId() {
  const settings = await prisma.instanceSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
    select: { instanceId: true },
  });
  return settings.instanceId;
}

async function refreshCache() {
  if (!appVersion || !env.API_BASE_URL) return;
  const instanceId = await getInstanceId();
  const url = `${env.API_BASE_URL}/updates?version=${encodeURIComponent(appVersion)}&instanceId=${encodeURIComponent(instanceId)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return;
    const parsed = upstreamResponseSchema.safeParse(await res.json());
    if (!parsed.success) return;
    cache = {
      latest: parsed.data.latest,
      url: parsed.data.url,
      fetchedAt: Date.now(),
    };
  } catch {
    // Swallow: receiver unreachable, timeout, malformed response.
    // Leave `cache` as-is so the next trigger retries.
  } finally {
    clearTimeout(timeout);
  }
}

export async function getUpdateStatus(): Promise<UpdateStatus> {
  if (!isSelfHosted || !env.API_BASE_URL) return { checkDisabled: true };

  const fresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (!fresh && !inFlight) {
    inFlight = refreshCache().finally(() => {
      inFlight = null;
    });
  }

  return {
    checkDisabled: false,
    currentVersion: appVersion,
    latestVersion: cache?.latest ?? null,
    updateAvailable:
      cache && appVersion ? isNewer(cache.latest, appVersion) : false,
    releaseUrl: cache?.url ?? null,
  };
}
