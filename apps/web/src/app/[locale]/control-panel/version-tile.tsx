import { Skeleton } from "@rallly/ui/skeleton";
import { Tile, TileDescription, TileTitle } from "@rallly/ui/tile";
import { DownloadIcon } from "lucide-react";
import { Suspense } from "react";
import { PageIcon } from "@/components/page-icons";
import { loadUpdateStatus } from "@/features/instance-settings/loaders";
import { getTranslation } from "@/i18n/server";
import { appVersion } from "@/lib/constants";

const RELEASES_URL = "https://github.com/lukevella/rallly/releases";

async function UpdateStatus() {
  const update = await loadUpdateStatus();

  if (!update) {
    return null;
  }

  const { t } = await getTranslation();

  if (update.status === "up-to-date") {
    return (
      <span className="text-green-600 text-sm">
        {t("upToDate", { defaultValue: "Up to date" })}
      </span>
    );
  }

  return (
    <span className="text-primary text-sm">
      {t("updateAvailable", { defaultValue: "Update available" })}
    </span>
  );
}

export function VersionTile() {
  return (
    <Tile
      render={
        <a href={RELEASES_URL} target="_blank" rel="noreferrer noopener" />
      }
    >
      <PageIcon>
        <DownloadIcon />
      </PageIcon>
      <TileTitle>
        {appVersion ? `v${appVersion.replace(/^v/, "")}` : "unknown"}
      </TileTitle>
      <TileDescription>
        <Suspense fallback={<Skeleton className="h-4 w-24" />}>
          <UpdateStatus />
        </Suspense>
      </TileDescription>
    </Tile>
  );
}
