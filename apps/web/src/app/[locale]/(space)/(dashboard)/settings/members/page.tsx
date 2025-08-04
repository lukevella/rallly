import { Badge } from "@rallly/ui/badge";
import type { Metadata } from "next";
import { InviteMemberButton } from "@/app/[locale]/(space)/(dashboard)/settings/members/components/header";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { SpaceRole } from "@/features/space/components/space-role";
import { loadInvites, loadMembers } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { InviteDropdownMenu } from "./components/invite-dropdown-menu";
import { MemberDropdownMenu } from "./components/member-dropdown-menu";

export default async function MembersSettingsPage() {
  const [members, invites] = await Promise.all([loadMembers(), loadInvites()]);

  return (
    <div className="space-y-8">
      <PageSection>
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="members" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="membersDescription"
              defaults="Members have access to your space"
            />
          </PageSectionDescription>
        </PageSectionHeader>
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
                      <div className="font-semibold text-sm">{member.name}</div>
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
          <InviteMemberButton />
        </PageSectionContent>
      </PageSection>
    </div>
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
