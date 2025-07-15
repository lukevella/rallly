import { type Prisma, prisma } from "@rallly/database";
import { UsersIcon } from "lucide-react";
import z from "zod";
import { PageIcon } from "@/app/components/page-icons";
import { requireAdmin } from "@/auth/queries";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import {
  FullWidthLayout,
  FullWidthLayoutContent,
  FullWidthLayoutHeader,
  FullWidthLayoutTitle,
} from "@/components/full-width-layout";
import { Pagination } from "@/components/pagination";
import { StackedList } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
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
  const adminUser = await requireAdmin();

  const where: Prisma.UserWhereInput = {};

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

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalUsers = await prisma.user.count({
    where,
  });

  return {
    adminUser,
    allUsers: allUsers.map((user) => ({
      ...user,
      image: user.image ?? undefined,
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

  const totalPages = Math.ceil(totalUsers / pageSize);
  const totalItems = allUsers.length;

  return (
    <FullWidthLayout>
      <FullWidthLayoutHeader>
        <FullWidthLayoutTitle
          icon={
            <PageIcon size="sm" color="darkGray">
              <UsersIcon />
            </PageIcon>
          }
        >
          <Trans i18nKey="users" defaults="Users" />
        </FullWidthLayoutTitle>
      </FullWidthLayoutHeader>
      <FullWidthLayoutContent>
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
                    />
                  ))}
                </StackedList>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
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
      </FullWidthLayoutContent>
    </FullWidthLayout>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("users", {
      defaultValue: "Users",
    }),
  };
}
