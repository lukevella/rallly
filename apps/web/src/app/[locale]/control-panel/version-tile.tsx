import { Skeleton } from "@rallly/ui/skeleton";
import { Tile, TileDescription, TileTitle } from "@rallly/ui/tile";
import { DownloadIcon } from "lucide-react";
import { Suspense } from "react";
import { PageIcon } from "@/components/page-icons";
import { loadUpdateStatus } from "@/features/instance-settings/loaders";
import { getTranslation } from "@/i18n/server";
import { appVersion } from "@/lib/constants";

const RELEASES_URL = "https://github.com/lukevella/rallly/releases";

const versionLabel = appVersion
  ? `v${appVersion.replace(/^v/, "")}`
  : "unknown";

// The title link is stretched over the whole tile; the new-major notice sits
// above it (position: relative) so both stay real, non-nested anchors.
function VersionTileFrame({
  href,
  children,
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Tile>
      <PageIcon>
        <DownloadIcon />
      </PageIcon>
      <TileTitle>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="after:absolute after:inset-0"
        >
          {versionLabel}
        </a>
      </TileTitle>
      {children}
    </Tile>
  );
}

async function UpdateStatusTile() {
  const update = await loadUpdateStatus();

  if (!update) {
    return <VersionTileFrame href={RELEASES_URL} />;
  }

  const { t } = await getTranslation();

  return (
    <VersionTileFrame
      href={update.status === "update-available" ? update.url : RELEASES_URL}
    >
      {update.newMajor ? (
        <a
          href={update.newMajor.migrationGuideUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="relative mt-1 text-amber-600 text-sm hover:underline"
        >
          {t("versionTileNewMajorNotice", {
            defaultValue: "v{major} is available. Read the migration guide.",
            major: update.newMajor.major,
          })}
        </a>
      ) : null}
      <TileDescription>
        {update.status === "up-to-date" ? (
          <span className="text-green-600">
            {t("upToDate", { defaultValue: "Up to date" })}
          </span>
        ) : (
          <span className="text-primary">
            {t("updateAvailable", { defaultValue: "Update available" })}
          </span>
        )}
      </TileDescription>
    </VersionTileFrame>
  );
}

export function VersionTile() {
  return (
    <Suspense
      fallback={
        <VersionTileFrame href={RELEASES_URL}>
          <TileDescription>
            <Skeleton className="h-4 w-24" />
          </TileDescription>
        </VersionTileFrame>
      }
    >
      <UpdateStatusTile />
    </Suspense>
  );
}
