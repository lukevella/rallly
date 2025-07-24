import { Badge } from "@rallly/ui/badge";
import { UserSearchIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MembersHeader } from "@/app/[locale]/(space)/members/components/header";
import { MembersTabs } from "@/app/[locale]/(space)/members/components/tabs";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Pagination } from "@/components/pagination";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { SpaceRole } from "@/features/space/components/space-role";
import { isSpacesEnabled } from "@/features/space/constants";
import { loadMembers } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { searchParamsSchema } from "./schema";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!isSpacesEnabled) {
    return notFound();
  }

  const { page, pageSize, q, role } = searchParamsSchema.parse(
    await searchParams,
  );

  const members = await loadMembers({
    page,
    pageSize,
    q,
    role,
  });

  return (
    <PageContainer>
      <MembersHeader />
      <PageContent className="space-y-4">
        <MembersTabs value={role}>
          {members.data.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <UserSearchIcon />
              </EmptyStateIcon>
              <EmptyStateTitle>
                <Trans i18nKey="noMembers" defaults="No members found" />
              </EmptyStateTitle>
              <EmptyStateDescription>
                <Trans
                  i18nKey="noMembersDescription"
                  defaults="Try adjusting your search"
                />
              </EmptyStateDescription>
            </EmptyState>
          ) : (
            <>
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
                  </StackedListItem>
                ))}
              </StackedList>
              <div>
                {members.total > pageSize ? (
                  <Pagination
                    currentPage={page}
                    totalItems={members.total}
                    pageSize={pageSize}
                  />
                ) : null}
              </div>
            </>
          )}
        </MembersTabs>
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
