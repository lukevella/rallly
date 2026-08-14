"use client";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { InfoIcon, MailIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { IfCloudHosted, IfSelfHosted } from "@/components/environment";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/components/page-layout";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { showPayWall } from "@/features/billing/client";
import { useSpace } from "@/features/space/client";
import { SpaceRole } from "@/features/space/components/space-role";
import { Trans } from "@/i18n/client";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
import { trpc } from "@/trpc/client";
import { InviteMemberButton } from "./components/invite-member-button";
import { MemberDropdownMenu } from "./components/member-dropdown-menu";
import { PendingInvitesDialog } from "./components/pending-invites-dialog";

export function MembersPage({
  totalSeats,
  usedSeats,
}: {
  totalSeats: number;
  usedSeats: number;
}) {
  const space = useSpace();
  const [members] = trpc.spaces.listMembers.useSuspenseQuery();
  const [invites] = trpc.spaces.listInvites.useSuspenseQuery();
  const canInviteMembers = space.getAbility().can("invite", "Member");
  const hasInactiveMembers = space.data.tier === "hobby" && members.total > 1;
  const availableSeats = Math.max(totalSeats - usedSeats, 0);
  const pendingInvitesDialog = useDialog();
  const { dismiss: dismissPendingInvitesDialog } = pendingInvitesDialog;

  React.useEffect(() => {
    if (invites.length === 0) {
      dismissPendingInvitesDialog();
    }
  }, [invites.length, dismissPendingInvitesDialog]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="members" defaults="Members" />
          </PageTitle>
        </PageHeaderContent>
        {canInviteMembers ? (
          <PageHeaderActions>
            <p className="mr-2 text-muted-foreground text-sm">
              <Trans
                i18nKey="seatsAvailable"
                defaults="{count, plural, =0 {No seats available} one {# seat available} other {# seats available}}"
                values={{ count: availableSeats }}
              />
            </p>
            <InviteMemberButton usedSeats={usedSeats} totalSeats={totalSeats} />
          </PageHeaderActions>
        ) : null}
      </PageHeader>
      <PageContent className="space-y-4">
        {canInviteMembers && invites.length > 0 ? (
          <Alert variant="primary">
            <MailIcon />
            <AlertDescription>
              <Trans
                i18nKey="pendingInvitesAlertDescription"
                defaults="{count, plural, one {There is # pending invite} other {There are # pending invites}}"
                values={{ count: invites.length }}
              />
            </AlertDescription>
            <AlertAction>
              <Button
                size="sm"
                onClick={() => {
                  pendingInvitesDialog.trigger();
                }}
              >
                <Trans i18nKey="viewInvites" defaults="View invites" />
              </Button>
            </AlertAction>
          </Alert>
        ) : null}
        {canInviteMembers && availableSeats <= 0 ? (
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
        <IfFeatureEnabled feature="billing">
          {hasInactiveMembers ? (
            <Alert>
              <InfoIcon />
              <AlertTitle>
                <Trans
                  i18nKey="membersInactiveAlertTitle"
                  defaults="Members are inactive"
                />
              </AlertTitle>
              <AlertDescription>
                <Trans
                  i18nKey="membersInactiveAlertDescription"
                  defaults="These members lost access when this space's Pro subscription ended. Their seats are kept and access is restored when the space is upgraded again."
                />
              </AlertDescription>
              <AlertAction>
                <Button
                  size="sm"
                  onClick={() => {
                    showPayWall({
                      from: "space-members",
                      action: "reactivate",
                    });
                  }}
                >
                  <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
        </IfFeatureEnabled>
        {!canInviteMembers && !hasInactiveMembers ? (
          <Alert variant="primary">
            <SparklesIcon />
            <AlertDescription>
              <Trans
                i18nKey="inviteMembersUpsellDescription"
                defaults="Invite members to manage polls and events together in this space."
              />
            </AlertDescription>
            <AlertAction>
              <Button
                size="sm"
                variant="link"
                onClick={() => {
                  showPayWall({ from: "space-members", action: "invite" });
                }}
              >
                <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
              </Button>
            </AlertAction>
          </Alert>
        ) : null}
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
                    <div className="font-semibold text-sm">{member.name}</div>
                    <div>
                      {member.isOwner ? (
                        <Badge>
                          <Trans i18nKey="owner" defaults="Owner" />
                        </Badge>
                      ) : null}
                      <IfFeatureEnabled feature="billing">
                        {space.data.tier === "hobby" && !member.isOwner ? (
                          <Badge>
                            <Trans
                              i18nKey="memberInactive"
                              defaults="Inactive"
                            />
                          </Badge>
                        ) : null}
                      </IfFeatureEnabled>
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
      </PageContent>
      <PendingInvitesDialog
        invites={invites}
        {...pendingInvitesDialog.dialogProps}
      />
    </PageContainer>
  );
}
