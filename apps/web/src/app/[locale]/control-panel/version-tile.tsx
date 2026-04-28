"use client";

import { Tile, TileDescription, TileTitle } from "@rallly/ui/tile";
import { DownloadIcon } from "lucide-react";
import { PageIcon } from "@/app/components/page-icons";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { appVersion } from "@/utils/constants";

const RELEASES_URL = "https://github.com/lukevella/rallly/releases";

export function VersionTile() {
  const { data, isFetching } = trpc.system.getUpdateStatus.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <Tile asChild>
      <a
        href={data?.url ?? RELEASES_URL}
        target="_blank"
        rel="noreferrer noopener"
      >
        <PageIcon>
          <DownloadIcon />
        </PageIcon>
        <TileTitle>{`v${appVersion ?? "unknown"}`}</TileTitle>
        <TileDescription>
          {isFetching ? (
            <Spinner />
          ) : data ? (
            <span className="text-primary text-sm">
              <Trans i18nKey="updateAvailable" defaults="Update available" />
            </span>
          ) : null}
        </TileDescription>
      </a>
    </Tile>
  );
}
