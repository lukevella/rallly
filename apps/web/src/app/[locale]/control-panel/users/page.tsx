import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import * as z from "zod";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { StackedList } from "@/components/stacked-list";
import { loadUsers } from "@/features/user/loaders";
import { inactivityPeriodSchema, userSortSchema } from "@/features/user/schema";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { UserFilters } from "./user-filters";
import { UserRow } from "./user-row";
import { UserSearchInput } from "./user-search-input";
import { UsersListSkeleton } from "./users-list-skeleton";
import { UsersTabbedView } from "./users-tabbed-view";

const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).default(10),
});

const roleSchema = z.enum(["admin", "user"]).optional().catch(undefined);
const inactiveForSchema = inactivityPeriodSchema.optional().catch(undefined);
const sortSchema = userSortSchema.catch("newest");

async function UsersList({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Inactivity is classified against the viewer's present, so the read is
  // request-bound rather than prerenderable.
  await connection();

  const searchParams = await searchParamsPromise;
  const { page, pageSize } = searchParamsSchema.parse(searchParams);
  const inactiveFor = inactiveForSchema.parse(searchParams.inactiveFor);
  const sort = sortSchema.parse(searchParams.sort);

  const { users, totalUsers } = await loadUsers({
    page,
    pageSize,
    q: searchParams.q ? String(searchParams.q) : undefined,
    role: roleSchema.parse(searchParams.role),
    inactiveFor,
    sort,
  });

  if (users.length === 0) {
    return (
      <EmptyState className="py-16">
        <EmptyStateIcon>
          <UsersIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noUsers" defaults="No users found" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="noUsersDescription"
            defaults="Try adjusting your search"
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <StackedList className="text-sm">
        {users.map((user) => (
          <UserRow
            key={user.id}
            name={user.name}
            email={user.email}
            userId={user.id}
            image={user.image}
            role={user.role}
            banned={user.banned}
            lastSeenAt={user.lastSeenAt}
            canChangeRole={user.canChangeRole}
            canBan={user.canBan}
            canDelete={user.canDelete}
          />
        ))}
      </StackedList>
      <Pagination
        currentPage={page}
        totalItems={totalUsers}
        pageSize={pageSize}
      />
    </div>
  );
}

export default async function AdminPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="users" defaults="Users" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="usersDescription"
            defaults="Manage users on this instance"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserSearchInput />
            <UserFilters />
          </div>
          <UsersTabbedView>
            <Suspense fallback={<UsersListSkeleton />}>
              <UsersList searchParams={props.searchParams} />
            </Suspense>
          </UsersTabbedView>
        </div>
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslation(locale);
  return {
    title: t("users", {
      defaultValue: "Users",
    }),
  };
}
