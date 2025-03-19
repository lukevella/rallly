import { prisma } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CalendarIcon, PlusIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getPolls } from "@/api/get-polls";
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

import { PollsTable } from "./polls/polls-table";

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

  const [user, pollsData, upcomingEvents] = await Promise.all([
    getUser(userSession.id),
    getPolls({
      userId: userSession.id,
      pageSize: 5,
    }),
    getUpcomingEvents(userSession.id),
  ]);

  return {
    user: {
      ...user,
      image: user.image ?? undefined,
    },
    recentPolls: pollsData.data,
    upcomingEvents,
  };
}

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  const { user, recentPolls, upcomingEvents } = await getData();
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
            <Button variant="primary" asChild>
              <Link href="/new">
                <Icon>
                  <PlusIcon />
                </Icon>
                <Trans
                  t={t}
                  i18nKey="createPoll"
                  defaults="Create Group Poll"
                />
              </Link>
            </Button>
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
              <Trans t={t} i18nKey="recentPolls" defaults="Recent Polls" />
            </CardContainerTitle>
            <Button variant="ghost" asChild>
              <Link href="/polls">
                <Trans t={t} i18nKey="viewAll" defaults="View All" />
              </Link>
            </Button>
          </CardContainerHeader>
          <CardContainerContent>
            {recentPolls.length > 0 ? (
              <PollsTable
                polls={recentPolls}
                totalPolls={recentPolls.length}
                currentPage={1}
                totalPages={1}
              />
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
                    defaults="You have no polls."
                  />
                </EmptyStateDescription>
              </EmptyState>
            )}
          </CardContainerContent>
        </CardContainer>
        <CardContainer>
          <CardContainerHeader>
            <CardContainerTitle>
              <Trans t={t} i18nKey="upcomingEvents" defaults="Upcoming" />
            </CardContainerTitle>
            <Button variant="ghost" asChild>
              <Link href="/events">
                <Trans t={t} i18nKey="viewAll" defaults="View All" />
              </Link>
            </Button>
          </CardContainerHeader>
          <CardContainerContent>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold">{event.title}</div>
                      <div className="text-muted-foreground">
                        <FormattedDate date={event.start} format="short" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState className="py-16">
                <EmptyStateIcon>
                  <CalendarIcon />
                </EmptyStateIcon>
                <EmptyStateTitle>
                  <Trans t={t} i18nKey="noEvents" defaults="No events" />
                </EmptyStateTitle>
                <EmptyStateDescription>
                  <Trans
                    t={t}
                    i18nKey="noEventsDescription"
                    defaults="When you schedule events, they will appear here."
                  />
                </EmptyStateDescription>
              </EmptyState>
            )}
          </CardContainerContent>
        </CardContainer>
      </PageContent>
    </PageContainer>
  );
}
