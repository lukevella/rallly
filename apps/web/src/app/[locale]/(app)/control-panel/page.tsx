import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { Tile, TileGrid, TileTitle } from "@rallly/ui/tile";
import {
  InfinityIcon,
  KeySquareIcon,
  PaletteIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIcon } from "@/app/components/page-icons";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { requireAdmin } from "@/auth/data";
import { DEFAULT_SEAT_LIMIT } from "@/features/licensing/constants";
import { loadInstanceLicense } from "@/features/licensing/data";
import { getUserCount } from "@/features/user/queries";
import { Trans } from "@/i18n/client";

async function loadData() {
  const [userCount, license] = await Promise.all([
    getUserCount(),
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

  const userLimit = license?.seats ?? DEFAULT_SEAT_LIMIT;
  const tier = license?.type;

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="home" defaults="Home" />
        </SettingsPageTitle>
      </SettingsPageHeader>
      <SettingsPageContent>
        <div className="space-y-4">
          <TileGrid>
            {/* USERS */}
            <Tile asChild>
              <Link href="/control-panel/users">
                <div className="flex justify-between">
                  <div>
                    <PageIcon>
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
                  <PageIcon>
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
            {/* BRANDING */}
            <Tile asChild>
              <Link href="/control-panel/branding">
                <div className="flex justify-between">
                  <PageIcon>
                    <PaletteIcon />
                  </PageIcon>
                </div>
                <TileTitle>
                  <Trans i18nKey="branding" defaults="Branding" />
                </TileTitle>
              </Link>
            </Tile>
            {/* INSTANCE SETTINGS */}
            <Tile asChild>
              <Link href="/control-panel/settings">
                <div className="flex justify-between">
                  <PageIcon>
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
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Control Panel",
  };
}
