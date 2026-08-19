import "server-only";

import { createLogger } from "@rallly/logger";
import * as z from "zod";
import { env } from "@/env";
import { appVersion } from "@/lib/constants";
import { getMajorVersion, isOutdated } from "./utils";

const logger = createLogger("update-check");

const updateStatusSchema = z.object({
  latest: z.string().nullish(),
  url: z.string().nullish(),
  publishedAt: z.string().nullish(),
  newMajor: z
    .object({
      version: z.string(),
      migrationGuideUrl: z.string(),
    })
    .nullish(),
});

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

    const currentMajor = getMajorVersion(appVersion);
    const { latest, url: releaseUrl, publishedAt, newMajor } = parsed.data;

    // The endpoint scopes `latest` to our own major. Guard anyway: a release
    // from another major must never surface as a pullable update, and this
    // code is frozen in fleet binaries.
    const withinMajor =
      latest &&
      releaseUrl &&
      publishedAt &&
      currentMajor !== null &&
      getMajorVersion(latest) === currentMajor &&
      isOutdated(appVersion, latest)
        ? {
            status: "update-available" as const,
            latest,
            url: releaseUrl,
            publishedAt,
          }
        : { status: "up-to-date" as const };

    const newMajorVersion = newMajor ? getMajorVersion(newMajor.version) : null;

    return {
      ...withinMajor,
      newMajor:
        newMajor &&
        currentMajor !== null &&
        newMajorVersion !== null &&
        newMajorVersion > currentMajor
          ? {
              major: newMajorVersion,
              migrationGuideUrl: newMajor.migrationGuideUrl,
            }
          : null,
    };
  } catch (error) {
    logger.warn(
      { error, instanceId, version: appVersion },
      "Failed to check for updates",
    );
    return null;
  }
}
