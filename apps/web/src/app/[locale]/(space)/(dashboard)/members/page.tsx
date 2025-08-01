import { Badge } from "@rallly/ui/badge";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InviteDropdownMenu } from "@/app/[locale]/(space)/(dashboard)/members/components/invite-dropdown-menu";
import { MemberDropdownMenu } from "@/app/[locale]/(space)/(dashboard)/members/components/member-dropdown-menu";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { SpaceRole } from "@/features/space/components/space-role";
import { isSpacesEnabled } from "@/features/space/constants";
import { loadInvites, loadMembers } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { MembersHeader } from "./components/header";

export default async function MembersPage() {
  if (!isSpacesEnabled) {
    return notFound();
  }

  const [members, invites] = await Promise.all([loadMembers(), loadInvites()]);

  return (
    <PageContainer>
      <MembersHeader />
      <PageContent className="space-y-6">
        <section className="flex flex-col gap-4">
          <h2 className="font-medium">
            <Trans i18nKey="members" />
          </h2>
          <StackedList>
            {members.data.map((member) => (
              <StackedListItem key={member.id}>
                <div className="flex flex-1 items-center gap-4">
                  <OptimizedAvatarImage
                    src={member.image ?? undefined}
                    name={member.name}
                    size="md"
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
        </section>
        {invites.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-medium">
              <Trans defaults="Pending Invites" />
            </h2>
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
                          defaults="Invited by {inviterName}"
                          values={{ inviterName: invite.invitedBy.name }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <SpaceRole
                      role={invite.role === "ADMIN" ? "admin" : "member"}
                    />
                  </div>
                  <InviteDropdownMenu invite={invite} />
                </StackedListItem>
              ))}
            </StackedList>
          </section>
        )}
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("members", {
      defaultValue: "Members",
    }),
  };
}
