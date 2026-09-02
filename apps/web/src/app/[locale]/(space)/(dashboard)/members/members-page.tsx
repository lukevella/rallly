import { subject } from "@casl/ability";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { InfoIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PageHeaderActions } from "@/components/page-layout";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { defineAbilityForSpace } from "@/features/space/ability";
import { SpaceRole } from "@/features/space/components/space-role";
import { getActiveSpace, getSeatUsage } from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import {
  loadPendingInvites,
  loadSpaceMembers,
} from "@/features/space/member/loaders";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { InviteMemberButton } from "./components/invite-member-button";
import { MemberDropdownMenu } from "./components/member-dropdown-menu";
import { PendingInvites } from "./components/pending-invites";
import { UpgradeToProButton } from "./components/upgrade-to-pro-button";

async function getMemberAbility() {
  const [user, space] = await Promise.all([requireUser(), getActiveSpace()]);

  return defineAbilityForMember({
    user: { id: user.id },
    space: { id: space.id, ownerId: space.ownerId, role: space.role },
  });
}

export async function MembersPageActions() {
  const space = await getActiveSpace();

  if (defineAbilityForSpace(space).cannot("invite", "Member")) {
    return null;
  }

  const [seatUsage, memberAbility] = await Promise.all([
    getSeatUsage(),
    getMemberAbility(),
  ]);
  const availableSeats = Math.max(seatUsage.total - seatUsage.used, 0);

  return (
    <PageHeaderActions>
      <p className="mr-2 text-muted-foreground text-sm">
        <Trans
          i18nKey="seatsAvailable"
          defaults="{count, plural, =0 {No seats available} one {# seat available} other {# seats available}}"
          values={{ count: availableSeats }}
        />
      </p>
      <InviteMemberButton
        disabled={availableSeats <= 0}
        canCreateInvite={memberAbility.can("create", "SpaceMemberInvite")}
      />
    </PageHeaderActions>
  );
}

export async function MembersPageContent() {
  const [space, members, seatUsage, memberAbility] = await Promise.all([
    getActiveSpace(),
    loadSpaceMembers(),
    getSeatUsage(),
    getMemberAbility(),
  ]);

  const canInviteMembers = defineAbilityForSpace(space).can("invite", "Member");
  const invites = canInviteMembers ? await loadPendingInvites() : [];
  const availableSeats = Math.max(seatUsage.total - seatUsage.used, 0);
  const hasInactiveMembers = space.tier === "hobby" && members.length > 1;

  return (
    <>
      {canInviteMembers ? (
        <PendingInvites
          invites={invites}
          canCancelInvite={memberAbility.can("delete", "SpaceMemberInvite")}
        />
      ) : null}
      {canInviteMembers && availableSeats <= 0 ? (
        <Alert variant="info">
          <InfoIcon />
          <AlertDescription>
            {isFeatureEnabled("billing") ? (
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
            ) : (
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
            )}
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
              <UpgradeToProButton action="reactivate" />
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
            <UpgradeToProButton action="invite" variant="link" />
          </AlertAction>
        </Alert>
      ) : null}
      <StackedList>
        {members.map((member) => (
          <StackedListItem key={member.id}>
            <div className="flex flex-1 items-center gap-4">
              <OptimizedAvatarImage
                src={member.image}
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
                      {space.tier === "hobby" && !member.isOwner ? (
                        <Badge>
                          <Trans i18nKey="memberInactive" defaults="Inactive" />
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
            <MemberDropdownMenu
              member={member}
              // subject() brands the object it's given in place, which would
              // make `member` fail React's plain-object check when serialized
              // as a client component prop — hence the copies.
              canUpdate={memberAbility.can(
                "update",
                subject("SpaceMember", { ...member }),
              )}
              canDelete={memberAbility.can(
                "delete",
                subject("SpaceMember", { ...member }),
              )}
            />
          </StackedListItem>
        ))}
      </StackedList>
    </>
  );
}
