import { Tile, TileDescription, TileGrid, TileTitle } from "@rallly/ui/tile";
import Link from "next/link";

import {
  BillingPageIcon,
  CreatePageIcon,
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
import { requireUser } from "@/auth/queries";
import { Trans } from "@/components/trans";
import { IfCloudHosted } from "@/contexts/environment";
import { getTranslation } from "@/i18n/server";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { FeedbackAlert } from "./feedback-alert";

async function loadData() {
  const user = await requireUser();

  if (!user) {
    return {
      livePollCount: 0,
      upcomingEventCount: 0,
    };
  }

  const todayStart = dayjs().startOf("day").toDate();
  const todayEnd = dayjs().endOf("day").toDate();

  const [livePollCount, upcomingEventCount] = await Promise.all([
    prisma.poll.count({
      where: {
        userId: user.id,
        status: "live",
        deleted: false,
      },
    }),
    prisma.scheduledEvent.count({
      where: {
        userId: user.id,
        OR: [
          { start: { gte: todayStart } },
          {
            allDay: true,
            start: { gte: todayStart, lte: todayEnd },
          },
        ],
      },
    }),
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
            <IfCloudHosted>
              <Tile asChild>
                <Link href="/settings/billing">
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

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
