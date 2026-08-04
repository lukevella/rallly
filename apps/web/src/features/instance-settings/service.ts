import "server-only";

import { createLogger } from "@rallly/logger";
import * as z from "zod";
import { env } from "@/env";
import { appVersion } from "@/lib/constants";

const logger = createLogger("update-check");

const updateStatusSchema = z.object({
  latest: z.string(),
  url: z.string(),
  publishedAt: z.string(),
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

export async function getUpdateStatus({ instanceId }: { instanceId: string }) {
  if (!appVersion || !env.API_BASE_URL) return null;

  const url = new URL("/api/updates", env.API_BASE_URL);
  url.searchParams.set("version", appVersion);
  url.searchParams.set("instanceId", instanceId);

  try {
    const res = await fetch(url, {
      // Node fetch has no default timeout — without this a hung upstream
      // holds the streamed slot open indefinitely on a cold cache
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      logger.warn(
        { instanceId, version: appVersion, status: res.status },
        "Update check returned a non-success status",
      );
      return null;
    }
    const parsed = updateStatusSchema.safeParse(await res.json());
    if (!parsed.success) {
      logger.warn(
        { instanceId, version: appVersion, issues: parsed.error.issues },
        "Update check returned an invalid response",
      );
      return null;
    }
    if (!isOutdated(appVersion, parsed.data.latest)) {
      return { status: "up-to-date" as const };
    }
    return { status: "update-available" as const, ...parsed.data };
  } catch (error) {
    logger.warn(
      { error, instanceId, version: appVersion },
      "Failed to check for updates",
    );
    return null;
  }
}
