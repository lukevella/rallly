import { PageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { requireAdmin } from "@/auth/queries";
import { Trans } from "@/components/trans";
import { getLicense } from "@/features/licensing/queries";
import { prisma } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Tile, TileGrid, TileTitle } from "@rallly/ui/tile";
import {
  GaugeIcon,
  KeySquareIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

async function loadData() {
  await requireAdmin();

  const [userCount, license] = await Promise.all([
    prisma.user.count(),
    getLicense(),
  ]);

  return {
    userCount,
    userLimit: license?.seats ?? 1,
    tier: license?.type,
  };
}

export default async function AdminPage() {
  const { userCount, userLimit, tier } = await loadData();
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon color="indigo">
            <GaugeIcon />
          </PageIcon>
          <Trans i18nKey="controlPanel" defaults="Control Panel" />
        </PageTitle>
      </PageHeader>
      <PageContent className="space-y-8">
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
                  <div className="text-sm text-muted-foreground">
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
                      {userLimit === Number.POSITIVE_INFINITY
                        ? "unlimited"
                        : userLimit}
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
                    <span className="text-sm text-primary capitalize">
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
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata() {
  return {
    title: "Control Panel",
  };
}
