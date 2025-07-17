import { UserSearchIcon } from "lucide-react";
import type { Metadata } from "next";
import z from "zod";
import { RolesTabbedView } from "@/app/[locale]/(space)/members/roles-tabbed-view";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { SearchInput } from "@/app/components/search-input";
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
import { loadMembers } from "@/data/space";
import { SpaceRole } from "@/features/spaces/components/space-role";
import { getTranslation } from "@/i18n/server";

const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).default(10),
  q: z.string().optional(),
  role: z.enum(["all", "member", "admin", "owner"]).optional().catch("all"),
});

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { t } = await getTranslation();

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
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="members" defaults="Members" />
        </PageTitle>
      </PageHeader>
      <PageContent className="space-y-4">
        <div>
          <SearchInput
            placeholder={t("searchMembers", { defaultValue: "Search members" })}
          />
        </div>
        <RolesTabbedView name="role" value={role}>
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
                      <div className="text-sm">
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm capitalize">
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
        </RolesTabbedView>
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
