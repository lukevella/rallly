import { prisma } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CalendarIcon, PlusIcon, UserIcon, ZapIcon } from "lucide-react";
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

async function getData() {
  const user = await requireUser();

  const [pollsData, upcomingEvents] = await Promise.all([
    getPolls({
      userId: user.id,
      pageSize: 5,
    }),
    getUpcomingEvents(user.id),
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
      <PageContent className="grid grid-cols-1 gap-8">
        <CardContainer>
          <div className="flex items-center gap-4">
            <div>
              <OptimizedAvatarImage
                src={user.image ?? undefined}
                name={user.name ?? "Guest"}
                size="lg"
              />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">
                {user.name}
              </div>
              <div className="text-muted-foreground flex items-center gap-0.5">
                <div>{user.timeZone}</div>
              </div>
            </div>
          </div>
        </CardContainer>
        <CardContainer>
          <CardContainerHeader>
            <CardContainerTitle>
              <div className="flex items-center gap-2">
                <ZapIcon className="text-primary size-4" />
                <span>Quick Actions</span>
              </div>
            </CardContainerTitle>
          </CardContainerHeader>
          <CardContainerContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/new"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="text-primary bg-primary/10 rounded-full p-3">
                  <PlusIcon className="size-5" />
                </div>
                <div className="font-medium">Create Poll</div>
              </Link>
              <Link
                href="/settings/profile"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="text-primary bg-primary/10 rounded-full p-3">
                  <UserIcon className="size-5" />
                </div>
                <div className="font-medium">Profile</div>
              </Link>
            </div>
          </CardContainerContent>
        </CardContainer>
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
              <EmptyState className="py-8">
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
