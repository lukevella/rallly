import { Tile, TileGrid, TileTitle } from "@rallly/ui/tile";

import type { Params } from "@/app/[locale]/types";
import {
  BillingPageIcon,
  CreatePageIcon,
  EventPageIcon,
  HomePageIcon,
  PollPageIcon,
  PreferencesPageIcon,
  ProfilePageIcon,
  TeamPageIcon,
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

export default async function Page({ params }: { params: Params }) {
  await getTranslation(params.locale);

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex flex-col gap-3">
          <HomePageIcon />
          <PageTitle>
            <Trans i18nKey="home" defaults="Home" />
          </PageTitle>
        </div>
        <PageDescription>
          <Trans
            i18nKey="homeDashboardDesc"
            defaults="Manage your polls, events, and account settings"
          />
        </PageDescription>
      </PageHeader>
      <PageContent className="space-y-8">
        <div className="space-y-4">
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
        </div>

        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeNavTitle" defaults="Navigation" />
          </h2>
          <TileGrid>
            <Tile href="/polls">
              <PollPageIcon />
              <TileTitle>
                <Trans i18nKey="polls" defaults="Polls" />
              </TileTitle>
            </Tile>

            <Tile href="/events">
              <EventPageIcon />
              <TileTitle>
                <Trans i18nKey="events" defaults="Events" />
              </TileTitle>
            </Tile>

            <Tile href="/team">
              <TeamPageIcon />
              <TileTitle>
                <Trans i18nKey="team" defaults="Team" />
              </TileTitle>
            </Tile>
          </TileGrid>
        </div>

        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="settings" defaults="Settings" />
          </h2>
          <TileGrid>
            <Tile href="/settings/profile">
              <ProfilePageIcon />
              <TileTitle>
                <Trans i18nKey="profile" defaults="Profile" />
              </TileTitle>
            </Tile>

            <Tile href="/settings/preferences">
              <PreferencesPageIcon />
              <TileTitle>
                <Trans i18nKey="preferences" defaults="Preferences" />
              </TileTitle>
            </Tile>

            <Tile href="/settings/billing">
              <BillingPageIcon />
              <TileTitle>
                <Trans i18nKey="billing" defaults="Billing" />
              </TileTitle>
            </Tile>
          </TileGrid>
        </div>
      </PageContent>
    </PageContainer>
  );
}
