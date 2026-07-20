"use client";

import { posthog } from "@rallly/posthog/client";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { InfoIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { IfCloudHosted, IfSelfHosted } from "@/components/environment";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionDivider,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { showPayWall } from "@/features/billing/client";
import { useSpace } from "@/features/space/client";
import { SpaceRole } from "@/features/space/components/space-role";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { InviteDropdownMenu } from "./components/invite-dropdown-menu";
import { InviteMemberButton } from "./components/invite-member-button";
import { MemberDropdownMenu } from "./components/member-dropdown-menu";

export function MembersSettingsPageClient() {
  const space = useSpace();
  const [members] = trpc.spaces.listMembers.useSuspenseQuery();
  const [invites] = trpc.spaces.listInvites.useSuspenseQuery();
  const [seats] = trpc.spaces.getSeats.useSuspenseQuery();
  const canInviteMembers = space.getAbility().can("invite", "Member");

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="members" defaults="Members" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="membersDescription"
            defaults="Members have access to your space"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          <PageSection>
            <PageSectionContent>
              <StackedList>
                {members.data.map((member) => (
                  <StackedListItem key={member.id}>
                    <div className="flex flex-1 items-center gap-4">
                      <OptimizedAvatarImage
                        src={member.image ?? undefined}
                        name={member.name}
                        size="xl"
                      />
                      <div>
                        <div className="flex items-center gap-x-2">
                          <div className="font-semibold text-sm">
                            {member.name}
                          </div>
                          <div>
                            {member.isOwner ? (
                              <Badge>
                                <Trans i18nKey="owner" defaults="Owner" />
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <SpaceRole role={member.role} />
                    </div>
                    <MemberDropdownMenu member={member} />
                  </StackedListItem>
                ))}
              </StackedList>
            </PageSectionContent>
          </PageSection>
          {!canInviteMembers ? (
            <Alert variant="primary">
              <SparklesIcon />
              <AlertDescription>
                <Trans
                  i18nKey="pendingInvitesUpgradeDescription"
                  defaults="Upgrade to Pro to invite members to your space."
                />
              </AlertDescription>
              <AlertAction>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    posthog?.capture("members_settings:upgrade_button_click");
                    showPayWall();
                  }}
                >
                  <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
                </Button>
              </AlertAction>
            </Alert>
          ) : (
            <>
              <PageSectionDivider />
              <PageSection>
                <PageSectionHeader>
                  <PageSectionTitle>
                    <Trans
                      i18nKey="pendingInvites"
                      defaults="Pending Invites"
                    />
                  </PageSectionTitle>
                  <PageSectionDescription>
                    <Trans
                      i18nKey="pendingInvitesDescription"
                      defaults="Invite other users to share your space."
                    />
                  </PageSectionDescription>
                </PageSectionHeader>
                <PageSectionContent>
                  {invites.length > 0 ? (
                    <StackedList>
                      {invites.map((invite) => (
                        <StackedListItem key={invite.id}>
                          <div className="flex flex-1 items-center gap-4">
                            <OptimizedAvatarImage
                              name={invite.email}
                              size="xl"
                            />
                            <div>
                              <div className="flex items-center gap-x-2">
                                <div className="font-semibold text-sm">
                                  {invite.email}
                                </div>
                              </div>
                              <div className="text-muted-foreground text-sm">
                                <Trans
                                  i18nKey="memberInvitedBy"
                                  defaults="Invited by {inviterName}"
                                  values={{
                                    inviterName: invite.invitedBy.name,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            <SpaceRole role={invite.role} />
                          </div>
                          <InviteDropdownMenu invite={invite} />
                        </StackedListItem>
                      ))}
                    </StackedList>
                  ) : null}
                  <div className="flex items-center gap-4">
                    <InviteMemberButton
                      usedSeats={seats.used}
                      totalSeats={seats.total}
                    />
                    <p className="font-medium text-sm">
                      <Trans
                        i18nKey="seatUsage"
                        defaults="{usedSeats} of {totalSeats} seats used"
                        values={{
                          usedSeats: seats.used,
                          totalSeats: seats.total,
                        }}
                      />
                    </p>
                  </div>
                  {seats.total - seats.used <= 0 ? (
                    <Alert variant="info">
                      <InfoIcon />
                      <AlertDescription>
                        <IfCloudHosted>
                          <p>
                            <Trans
                              i18nKey="noSeatsAvailableAlertBillingDescription"
                              defaults="Increase the number of seats in this space from the <a>billing page</a>."
                              components={{
                                a: (
                                  <Link
                                    className="underline hover:text-foreground"
                                    href="/settings/billing"
                                  />
                                ),
                              }}
                            />
                          </p>
                        </IfCloudHosted>
                        <IfSelfHosted>
                          <p>
                            <Trans
                              i18nKey="noSeatsAvailableAlertSelfHostedDescription"
                              defaults="You will need to <a>upgrade</a> to increase the number of seats in this space."
                              components={{
                                a: (
                                  <Link
                                    className="underline hover:text-foreground"
                                    prefetch={false}
                                    href="https://support.rallly.co/self-hosting/licensing"
                                  />
                                ),
                              }}
                            />
                          </p>
                        </IfSelfHosted>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </PageSectionContent>
              </PageSection>
            </>
          )}
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}
