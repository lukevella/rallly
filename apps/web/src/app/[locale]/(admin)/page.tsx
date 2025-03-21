import { prisma } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CalendarIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getPolls } from "@/api/get-polls";
import { getRecentlyUpdatedPolls } from "@/api/get-recently-updated-polls";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { FormattedDate } from "@/components/formatted-date";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { DateDisplay } from "@/features/timezone";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { RecentPollsTable } from "./recent-polls-table";
import { RecentlyUpdatedPollsGrid } from "./recently-updated-polls-grid";

function CardContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(className)}>{children}</div>;
}

function CardContainerHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

function CardContainerTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-base font-semibold tracking-tight text-gray-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardContainerContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

async function getUpcomingEvents(userId: string) {
  return prisma.event.findMany({
    where: {
      userId,
      start: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      start: true,
    },
    orderBy: {
      start: "asc",
    },
    take: 3,
  });
}

async function getUser(id: string) {
  return prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      image: true,
      timeZone: true,
      createdAt: true,
    },
  });
}

async function getData() {
  const userSession = await requireUser();

  const [user, pollsData, upcomingEvents, recentlyUpdatedPolls] =
    await Promise.all([
      getUser(userSession.id),
      getPolls({
        userId: userSession.id,
        status: "live",
        pageSize: 3,
      }),
      getUpcomingEvents(userSession.id),
      getRecentlyUpdatedPolls({
        userId: userSession.id,
      }),
    ]);

  return {
    user: {
      ...user,
      image: user.image ?? undefined,
    },
    recentPolls: pollsData.data,
    upcomingEvents,
    recentlyUpdatedPolls,
  };
}

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  const { user, recentPolls, upcomingEvents, recentlyUpdatedPolls } =
    await getData();
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-3">
          <PageTitle>
            <Trans t={t} i18nKey="home" defaults="Home" />
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent className="space-y-6">
        <div className="relative isolate flex flex-col items-center gap-4 rounded-lg bg-gray-100 pb-8 text-center">
          <div className="-mt-8">
            <OptimizedAvatarImage
              className="ring-4 ring-white"
              src={user.image ?? undefined}
              name={user.name ?? "Guest"}
              size="xl"
            />
          </div>
          <div>
            <div className="mb-1 text-lg font-bold leading-none tracking-tight">
              {user.name}
            </div>
            <div className="text-muted-foreground flex items-center gap-0.5">
              <div>
                <DateDisplay date={user.createdAt} format="Since MMMM YYYY" />
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link href="/settings/profile">
                <Icon>
                  <UserIcon />
                </Icon>
                <Trans t={t} i18nKey="editProfile" defaults="Edit Profile" />
              </Link>
            </Button>
          </div>
        </div>

        <CardContainer>
          <CardContainerHeader>
            <CardContainerTitle>
              <Trans
                t={t}
                i18nKey="recentlyUpdatedPolls"
                defaults="Recently Updated"
              />
            </CardContainerTitle>
          </CardContainerHeader>
          <CardContainerContent>
            {recentlyUpdatedPolls.length > 0 ? (
              <RecentlyUpdatedPollsGrid polls={recentlyUpdatedPolls} />
            ) : (
              <EmptyState>
                <EmptyStateIcon>
                  <CalendarIcon />
                </EmptyStateIcon>
                <EmptyStateTitle>
                  <Trans t={t} i18nKey="noPolls" defaults="No polls" />
                </EmptyStateTitle>
                <EmptyStateDescription>
                  <Trans
                    t={t}
                    i18nKey="noPollsDescription"
                    defaults="You haven't created any polls yet."
                  />
                </EmptyStateDescription>
                <Button asChild>
                  <Link href="/new">
                    <Trans t={t} i18nKey="createPoll" defaults="Create Poll" />
                  </Link>
                </Button>
              </EmptyState>
            )}
          </CardContainerContent>
        </CardContainer>
      </PageContent>
    </PageContainer>
  );
}
