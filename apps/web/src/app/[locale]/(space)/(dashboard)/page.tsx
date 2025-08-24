import { prisma } from "@rallly/database";
import { Tile, TileDescription, TileGrid, TileTitle } from "@rallly/ui/tile";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BillingPageIcon,
  CreatePageIcon,
  EventPageIcon,
  MembersPageIcon,
  PollPageIcon,
  SettingsPageIcon,
} from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { requireSpace, requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
import { IfCloudHosted } from "@/contexts/environment";
import { getUpcomingEventsCount } from "@/features/scheduled-event/data";
import { loadMembers } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { getTranslation } from "@/i18n/server";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
import { FeedbackAlert } from "./feedback-alert";

async function loadData() {
  const [space, user] = await Promise.all([requireSpace(), requireUser()]);

  const [livePollCount, upcomingEventCount, memberCount, seatCount] =
    await Promise.all([
      prisma.poll.count({
        where: {
          spaceId: space.id,
          status: "live",
          deleted: false,
        },
      }),
      getUpcomingEventsCount(),
      loadMembers().then((members) => members.total),
      getTotalSeatsForSpace(space.id),
    ]);

  const ability = defineAbilityForMember({ space, user });
  const canManageBilling = ability.can("manage", "Billing");

  return {
    livePollCount,
    upcomingEventCount,
    memberCount,
    seatCount,
    canManageBilling,
  };
}

export default async function Page() {
  const {
    livePollCount,
    upcomingEventCount,
    memberCount,
    seatCount,
    canManageBilling,
  } = await loadData();

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
            <Trans i18nKey="content" defaults="Content" />
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
            <Trans i18nKey="manage" defaults="Manage" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <Link href="/settings/general">
                <SettingsPageIcon />
                <TileTitle>
                  <Trans i18nKey="settings" defaults="Settings" />
                </TileTitle>
              </Link>
            </Tile>

            <Tile asChild>
              <Link href="/settings/members">
                <MembersPageIcon />
                <TileTitle>
                  <Trans i18nKey="members" defaults="Members" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="memberCount"
                    defaults="{count, plural, =0 {No members} one {1 member} other {# members}}"
                    values={{ count: memberCount }}
                  />
                </TileDescription>
              </Link>
            </Tile>

            <IfFeatureEnabled feature="billing">
              {canManageBilling && (
                <Tile asChild>
                  <Link href="/settings/billing">
                    <BillingPageIcon />
                    <TileTitle>
                      <Trans i18nKey="billing" defaults="Billing" />
                    </TileTitle>
                    <TileDescription>
                      <Trans
                        i18nKey="seatCount"
                        defaults="{count, plural, =0 {No seats} one {1 seat} other {# seats}}"
                        values={{ count: seatCount }}
                      />
                    </TileDescription>
                  </Link>
                </Tile>
              )}
            </IfFeatureEnabled>
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
