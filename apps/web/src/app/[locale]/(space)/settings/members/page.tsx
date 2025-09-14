import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { InfoIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionDivider,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { requireSpace } from "@/auth/data";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { IfCloudHosted, IfSelfHosted } from "@/contexts/environment";
import { SpaceRole } from "@/features/space/components/space-role";
import { loadInvites, loadMembers } from "@/features/space/data";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { getTranslation } from "@/i18n/server";
import { InviteDropdownMenu } from "./components/invite-dropdown-menu";
import { InviteMemberButton } from "./components/invite-member-button";
import { MemberDropdownMenu } from "./components/member-dropdown-menu";

export default async function MembersSettingsPage() {
  const space = await requireSpace();
  const [members, invites, totalSeats] = await Promise.all([
    loadMembers(),
    loadInvites(),
    getTotalSeatsForSpace(space.id),
  ]);

  const usedSeats = members.total;

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="members" />
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
                        size="lg"
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
          <PageSectionDivider />
          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="pendingInvites" defaults="Pending Invites" />
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
                        <OptimizedAvatarImage name={invite.email} size="md" />
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
                              values={{ inviterName: invite.invitedBy.name }}
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
                  usedSeats={usedSeats}
                  totalSeats={totalSeats}
                />
                <p className="font-medium text-sm">
                  <Trans
                    i18nKey="seatUsage"
                    defaults="{usedSeats} of {totalSeats} seats used"
                    values={{ usedSeats, totalSeats }}
                  />
                </p>
              </div>
              {totalSeats - usedSeats <= 0 ? (
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
                                className="underline"
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
                                className="underline"
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
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("members", {
      defaultValue: "Members",
    }),
    description: t("membersSettingsDescription", {
      defaultValue:
        "Manage space members, invite new users, and control access permissions.",
    }),
  };
}
