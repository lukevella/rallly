import { Tile, TileDescription, TileTitle } from "@rallly/ui/tile";
import { DownloadIcon } from "lucide-react";
import { PageIcon } from "@/components/page-icons";
import { getInstanceSettings } from "@/features/instance-settings/data";
import { getUpdateStatus } from "@/features/instance-settings/service";
import { Trans } from "@/i18n/client";
import { appVersion } from "@/lib/constants";

const RELEASES_URL = "https://github.com/lukevella/rallly/releases";

function VersionTileView({
  url,
  updateAvailable,
}: {
  url: string;
  updateAvailable?: boolean;
}) {
  return (
    <Tile render={<a href={url} target="_blank" rel="noreferrer noopener" />}>
      <PageIcon>
        <DownloadIcon />
      </PageIcon>
      <TileTitle>{`v${appVersion ?? "unknown"}`}</TileTitle>
      <TileDescription>
        {updateAvailable ? (
          <span className="text-primary text-sm">
            <Trans i18nKey="updateAvailable" defaults="Update available" />
          </span>
        ) : null}
      </TileDescription>
    </Tile>
  );
}

export function VersionTileFallback() {
  return <VersionTileView url={RELEASES_URL} />;
}

export async function VersionTile() {
  const { instanceId } = await getInstanceSettings();
  const update = instanceId ? await getUpdateStatus({ instanceId }) : null;

  return (
    <VersionTileView
      url={update?.url ?? RELEASES_URL}
      updateAvailable={Boolean(update)}
    />
  );
}
