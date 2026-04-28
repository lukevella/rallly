import { prisma } from "@rallly/database";
import * as z from "zod";
import { env } from "@/env";
import { createCache } from "@/lib/cache";
import { appVersion } from "@/utils/constants";
import { adminProcedure, router } from "../trpc";

const upstreamSchema = z.object({
  latest: z.string(),
  url: z.string(),
  publishedAt: z.string(),
});

type UpstreamPayload = z.infer<typeof upstreamSchema>;

const updatesCache = createCache<UpstreamPayload>({
  namespace: "system:updates",
  ttl: "1 h",
});

function normalizeVersion(version: string) {
  return version.replace(/^v/, "").split(/[-+]/)[0];
}

function isOutdated(current: string, latest: string) {
  const a = normalizeVersion(current)
    .split(".")
    .map((n) => Number(n) || 0);
  const b = normalizeVersion(latest)
    .split(".")
    .map((n) => Number(n) || 0);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai !== bi) return ai < bi;
  }
  return false;
}

async function fetchLatestRelease(
  instanceId: string,
): Promise<UpstreamPayload | null> {
  const cached = await updatesCache.get("latest");
  if (cached) return cached;

  if (!appVersion || !env.API_BASE_URL) return null;

  const url = new URL("/api/updates", env.API_BASE_URL);
  url.searchParams.set("version", appVersion);
  url.searchParams.set("instanceId", instanceId);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const parsed = upstreamSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    await updatesCache.set("latest", parsed.data);
    return parsed.data;
  } catch {
    return null;
  }
}

export const system = router({
  getUpdateStatus: adminProcedure.query(async () => {
    if (!appVersion || !env.API_BASE_URL) return null;

    const settings = await prisma.instanceSettings.findUnique({
      where: { id: 1 },
      select: { instanceId: true },
    });
    if (!settings) return null;

    const upstream = await fetchLatestRelease(settings.instanceId);
    if (!upstream) return null;
    if (!isOutdated(appVersion, upstream.latest)) return null;
    return upstream;
  }),
});
