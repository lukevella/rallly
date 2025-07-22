import { prisma } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { Tile, TileGrid, TileTitle } from "@rallly/ui/tile";
import {
  GaugeIcon,
  InfinityIcon,
  KeySquareIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIcon } from "@/app/components/page-icons";
import { requireAdmin } from "@/auth/data";
import {
  FullWidthLayout,
  FullWidthLayoutContent,
  FullWidthLayoutHeader,
  FullWidthLayoutTitle,
} from "@/components/full-width-layout";
import { Trans } from "@/components/trans";
import { loadInstanceLicense } from "@/features/licensing/data";

async function loadData() {
  const [userCount, license] = await Promise.all([
    prisma.user.count(),
    loadInstanceLicense(),
    requireAdmin(),
  ]);

  return {
    userCount,
    license,
  };
}

export default async function AdminPage() {
  const { userCount, license } = await loadData();

  const userLimit = license?.seats ?? 1;
  const tier = license?.type;

  return (
    <FullWidthLayout>
      <FullWidthLayoutHeader>
        <FullWidthLayoutTitle
          icon={
            <PageIcon size="sm" color="indigo">
              <GaugeIcon />
            </PageIcon>
          }
        >
          <Trans i18nKey="controlPanel" defaults="Control Panel" />
        </FullWidthLayoutTitle>
      </FullWidthLayoutHeader>
      <FullWidthLayoutContent>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeNavTitle" defaults="Navigation" />
          </h2>
          <TileGrid>
            {/* USERS */}
            <Tile asChild>
              <Link href="/control-panel/users">
                <div className="flex justify-between">
                  <div>
                    <PageIcon color="darkGray">
                      <UsersIcon />
                    </PageIcon>
                    <TileTitle>
                      <Trans i18nKey="users" defaults="Users" />
                    </TileTitle>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    <span
                      className={cn({
                        "text-destructive":
                          userLimit !== null && userCount > userLimit,
                      })}
                    >
                      <Trans
                        i18nKey="userCount"
                        defaults="{count, number, ::compact-short}"
                        values={{ count: userCount }}
                      />
                      /
                      {userLimit === Number.POSITIVE_INFINITY ? (
                        <Icon className="inline-flex">
                          <InfinityIcon />
                        </Icon>
                      ) : (
                        userLimit
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            </Tile>
            {/* LICENSE */}
            <Tile asChild>
              <Link href="/control-panel/license">
                <div className="flex justify-between">
                  <PageIcon color="darkGray">
                    <KeySquareIcon />
                  </PageIcon>
                  {tier ? (
                    <span className="text-primary text-sm capitalize">
                      {tier}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      <Trans i18nKey="unlicensed" defaults="Unlicensed" />
                    </span>
                  )}
                </div>
                <TileTitle>
                  <Trans i18nKey="license" defaults="License" />
                </TileTitle>
              </Link>
            </Tile>
            {/* INSTANCE SETTINGS */}
            <Tile asChild>
              <Link href="/control-panel/settings">
                <div className="flex justify-between">
                  <PageIcon color="darkGray">
                    <SettingsIcon />
                  </PageIcon>
                </div>
                <TileTitle>
                  <Trans i18nKey="settings" defaults="Settings" />
                </TileTitle>
              </Link>
            </Tile>
          </TileGrid>
        </div>
      </FullWidthLayoutContent>
    </FullWidthLayout>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Control Panel",
  };
}
