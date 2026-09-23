import { subject } from "@casl/ability";
import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";
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
import { defineAbilityFor } from "@/features/user/ability";
import { loadAdmin } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { UserRow } from "./user-row";
import { UserSearchInput } from "./user-search-input";
import { UsersTabbedView } from "./users-tabbed-view";

async function loadData({
  page,
  pageSize,
  q,
  role,
}: {
  page: number;
  pageSize: number;
  q?: string;
  role?: "admin" | "user";
}) {
  const user = await loadAdmin();

  const where: Prisma.UserWhereInput = {
    isAnonymous: false,
  };

  if (q) {
    where.OR = [
      {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: q,
          mode: "insensitive",
        },
      },
    ];
  }

  if (role) {
    where.role = role;
  }

  const [allUsers, totalUsers] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        spaces: {
          select: { id: true, name: true, nonprofitDiscountGrantedAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      where,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({
      where,
    }),
  ]);

  const ability = defineAbilityFor({ role: user.role, id: user.id });
  const isNonprofitDiscountEnabled = isFeatureEnabled("nonprofitDiscount");

  return {
    adminUser: user,
    allUsers: allUsers.map(({ spaces, ...u }) => ({
      ...u,
      image: u.image ?? undefined,
      nonprofitSpaces: isNonprofitDiscountEnabled
        ? spaces.map((space) => ({
            id: space.id,
            name: space.name,
            granted: space.nonprofitDiscountGrantedAt !== null,
          }))
        : [],
      canChangeRole: ability.can("update", subject("User", u), "role"),
      canBan: ability.can("update", subject("User", u), "banned"),
      canDelete: ability.can("delete", subject("User", u)),
    })),
    totalUsers,
  };
}

const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).default(10),
});

const roleSchema = z.enum(["admin", "user"]).optional().catch(undefined);

export default async function AdminPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page, pageSize } = searchParamsSchema.parse(searchParams);

  const { allUsers, totalUsers } = await loadData({
    page,
    pageSize,
    q: searchParams.q ? String(searchParams.q) : undefined,
    role: roleSchema.parse(searchParams.role),
  });

  const totalItems = totalUsers;

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
          <UserSearchInput />
          <UsersTabbedView>
            {allUsers.length > 0 ? (
              <div className="space-y-4">
                <StackedList className="text-sm">
                  {allUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      name={user.name}
                      email={user.email}
                      userId={user.id}
                      image={user.image}
                      role={user.role}
                      banned={user.banned}
                      canChangeRole={user.canChangeRole}
                      canBan={user.canBan}
                      canDelete={user.canDelete}
                      nonprofitSpaces={user.nonprofitSpaces}
                    />
                  ))}
                </StackedList>
                <Pagination
                  currentPage={page}
                  totalItems={totalItems}
                  pageSize={pageSize}
                />
              </div>
            ) : (
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
            )}
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
