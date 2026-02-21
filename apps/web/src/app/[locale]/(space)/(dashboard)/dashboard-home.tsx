"use client";

import { Tile, TileDescription, TileGrid, TileTitle } from "@rallly/ui/tile";
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
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { Trans } from "@/i18n/client";
import { IfFeatureEnabled, useFeatureFlag } from "@/lib/feature-flags/client";
import { trpc } from "@/trpc/client";
import { PasswordSetupAlert } from "./password-setup-alert";

export function DashboardHome() {
  const [stats] = trpc.dashboard.stats.useSuspenseQuery();
  const isEmailLoginEnabled = useFeatureFlag("emailLogin");

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="home" defaults="Home" />
        </PageTitle>
      </PageHeader>
      <PageContent className="space-y-8">
        <div className="space-y-4">
          {stats.hasNoAccounts && isEmailLoginEnabled ? (
            <PasswordSetupAlert />
          ) : null}
        </div>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeActionsTitle" defaults="Actions" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <HoverPrefetchLink href="/new">
                <CreatePageIcon />
                <TileTitle>
                  <Trans i18nKey="create" defaults="Create" />
                </TileTitle>
              </HoverPrefetchLink>
            </Tile>
          </TileGrid>
        </div>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="content" defaults="Content" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <HoverPrefetchLink href="/polls">
                <PollPageIcon />
                <TileTitle>
                  <Trans i18nKey="polls" defaults="Polls" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="openPollCount"
                    defaults="{count} open"
                    values={{ count: stats.openPollCount }}
                  />
                </TileDescription>
              </HoverPrefetchLink>
            </Tile>

            <Tile asChild>
              <HoverPrefetchLink href="/events">
                <EventPageIcon />
                <TileTitle>
                  <Trans i18nKey="events" defaults="Events" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="upcomingEventCount"
                    defaults="{count} upcoming"
                    values={{ count: stats.upcomingEventCount }}
                  />
                </TileDescription>
              </HoverPrefetchLink>
            </Tile>
          </TileGrid>
        </div>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="manage" defaults="Manage" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <HoverPrefetchLink href="/settings/general">
                <SettingsPageIcon />
                <TileTitle>
                  <Trans i18nKey="settings" defaults="Settings" />
                </TileTitle>
              </HoverPrefetchLink>
            </Tile>

            <Tile asChild>
              <HoverPrefetchLink href="/settings/members">
                <MembersPageIcon />
                <TileTitle>
                  <Trans i18nKey="members" defaults="Members" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="memberCount"
                    defaults="{count, plural, =0 {No members} one {1 member} other {# members}}"
                    values={{ count: stats.memberCount }}
                  />
                </TileDescription>
              </HoverPrefetchLink>
            </Tile>

            <IfFeatureEnabled feature="billing">
              {stats.canManageBilling && (
                <Tile asChild>
                  <HoverPrefetchLink href="/settings/billing">
                    <BillingPageIcon />
                    <TileTitle>
                      <Trans i18nKey="billing" defaults="Billing" />
                    </TileTitle>
                    <TileDescription>
                      <Trans
                        i18nKey="seatCount"
                        defaults="{count, plural, =0 {No seats} one {1 seat} other {# seats}}"
                        values={{ count: stats.seatCount }}
                      />
                    </TileDescription>
                  </HoverPrefetchLink>
                </Tile>
              )}
            </IfFeatureEnabled>
          </TileGrid>
        </div>
      </PageContent>
    </PageContainer>
  );
}
