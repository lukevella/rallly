import { prisma } from "@rallly/database";
import { Tile, TileDescription, TileGrid, TileTitle } from "@rallly/ui/tile";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BillingPageIcon,
  CreatePageIcon,
  EventPageIcon,
  PollPageIcon,
  PreferencesPageIcon,
  ProfilePageIcon,
} from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { IfCloudHosted } from "@/contexts/environment";
import { loadUpcomingEventsCount } from "@/data/event";
import { loadActiveSpace } from "@/data/space";
import { getTranslation } from "@/i18n/server";
import { FeedbackAlert } from "./feedback-alert";

async function loadData() {
  const space = await loadActiveSpace();

  const [livePollCount, upcomingEventCount] = await Promise.all([
    prisma.poll.count({
      where: {
        spaceId: space.id,
        status: "live",
        deleted: false,
      },
    }),
    loadUpcomingEventsCount(),
  ]);

  return {
    livePollCount,
    upcomingEventCount,
  };
}

export default async function Page() {
  const { livePollCount, upcomingEventCount } = await loadData();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="home" defaults="Home" />
        </PageTitle>
      </PageHeader>
      <PageContent className="space-y-8">
        <IfCloudHosted>
          <FeedbackAlert />
        </IfCloudHosted>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeActionsTitle" defaults="Actions" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <Link href="/new">
                <CreatePageIcon />
                <TileTitle>
                  <Trans i18nKey="create" defaults="Create" />
                </TileTitle>
              </Link>
            </Tile>
          </TileGrid>
        </div>
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
                <TileDescription>
                  <Trans
                    i18nKey="livePollCount"
                    defaults="{count} live"
                    values={{ count: livePollCount }}
                  />
                </TileDescription>
              </Link>
            </Tile>

            <Tile asChild>
              <Link href="/events">
                <EventPageIcon />
                <TileTitle>
                  <Trans i18nKey="events" defaults="Events" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="upcomingEventCount"
                    defaults="{count} upcoming"
                    values={{ count: upcomingEventCount }}
                  />
                </TileDescription>
              </Link>
            </Tile>
          </TileGrid>
        </div>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="account" defaults="Account" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <Link href="/account/profile">
                <ProfilePageIcon />
                <TileTitle>
                  <Trans i18nKey="profile" defaults="Profile" />
                </TileTitle>
              </Link>
            </Tile>

            <Tile asChild>
              <Link href="/account/preferences">
                <PreferencesPageIcon />
                <TileTitle>
                  <Trans i18nKey="preferences" defaults="Preferences" />
                </TileTitle>
              </Link>
            </Tile>
            <IfCloudHosted>
              <Tile asChild>
                <Link href="/account/billing">
                  <BillingPageIcon />
                  <TileTitle>
                    <Trans i18nKey="billing" defaults="Billing" />
                  </TileTitle>
                </Link>
              </Tile>
            </IfCloudHosted>
          </TileGrid>
        </div>
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
