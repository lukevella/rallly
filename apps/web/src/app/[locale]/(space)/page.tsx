import { Tile, TileGrid, TileTitle } from "@rallly/ui/tile";
import Link from "next/link";

import type { Params } from "@/app/[locale]/types";
import {
  BillingPageIcon,
  EventPageIcon,
  HomePageIcon,
  PollPageIcon,
  PreferencesPageIcon,
  ProfilePageIcon,
} from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";

export default async function Page(props: { params: Promise<Params> }) {
  const params = await props.params;
  await getTranslation(params.locale);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <HomePageIcon />
          <Trans i18nKey="home" defaults="Home" />
        </PageTitle>
        <PageDescription>
          <Trans
            i18nKey="homeDashboardDesc"
            defaults="Manage your polls, events, and account settings"
          />
        </PageDescription>
      </PageHeader>
      <PageContent className="space-y-8">
        {/* <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeActionsTitle" defaults="Actions" />
          </h2>
          <TileGrid>
            <Tile href="/new">
              <CreatePageIcon />
              <TileTitle>
                <Trans i18nKey="create" defaults="Create" />
              </TileTitle>
            </Tile>
          </TileGrid>
        </div> */}

        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeNavTitle" defaults="Navigation" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <Link href="/polls">
                <PollPageIcon />
                <TileTitle>
                  <Trans i18nKey="polls" defaults="Polls" />
                </TileTitle>
              </Link>
            </Tile>

            <Tile asChild>
              <Link href="/events">
                <EventPageIcon />
                <TileTitle>
                  <Trans i18nKey="events" defaults="Events" />
                </TileTitle>
              </Link>
            </Tile>

            {/* <Tile href="/members">
              <MembersPageIcon />
              <TileTitle>
                <Trans i18nKey="members" defaults="Members" />
              </TileTitle>
            </Tile> */}
          </TileGrid>
        </div>

        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="account" defaults="Account" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <Link href="/settings/profile">
                <ProfilePageIcon />
                <TileTitle>
                  <Trans i18nKey="profile" defaults="Profile" />
                </TileTitle>
              </Link>
            </Tile>

            <Tile asChild>
              <Link href="/settings/preferences">
                <PreferencesPageIcon />
                <TileTitle>
                  <Trans i18nKey="preferences" defaults="Preferences" />
                </TileTitle>
              </Link>
            </Tile>

            <Tile asChild>
              <Link href="/settings/billing">
                <BillingPageIcon />
                <TileTitle>
                  <Trans i18nKey="billing" defaults="Billing" />
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
  const { t } = await getTranslation();
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
