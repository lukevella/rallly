import { prisma } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CalendarIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
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
import {
  PollItem,
  PollItemContent,
  PollItemDateRange,
  PollItemDetails,
  PollItemIcon,
  PollItemTitle,
} from "@/components/poll-item";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

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

function getUpcomingEvents(userId: string) {
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

async function getRecentPolls(userId: string) {
  const polls = await prisma.poll.findMany({
    where: {
      userId,
      status: "live",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      location: true,
      options: {
        select: {
          startTime: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
      participants: {
        select: {
          id: true,
          name: true,
          user: {
            select: {
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      _count: {
        select: {
          participants: true,
          comments: true,
          options: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  return polls.map((poll) => {
    const lastOption = poll.options[poll.options.length - 1];
    return {
      id: poll.id,
      title: poll.title,
      createdAt: poll.createdAt,
      location: poll.location,
      from: poll.options[0].startTime,
      to: lastOption.startTime,
      optionsCount: poll._count.options,
      participants: poll._count.participants,
      participantsList: poll.participants,
    };
  });
}

async function getData() {
  const user = await requireUser();

  const [recentPolls, upcomingEvents] = await Promise.all([
    getRecentPolls(user.id),
    getUpcomingEvents(user.id),
  ]);

  return {
    user: {
      ...user,
      image: user.image ?? undefined,
    },
    recentPolls,
    upcomingEvents,
  };
}

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  const { user, recentPolls, upcomingEvents } = await getData();
  return (
    <div>
      <PageContainer>
        <PageHeader>
          <div className="flex items-center gap-x-3">
            <PageIcon>
              <HomeIcon />
            </PageIcon>
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
                  size="xl"
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
                <Trans t={t} i18nKey="pendingEvents" defaults="Pending" />
              </CardContainerTitle>
              <Button variant="ghost" asChild>
                <Link href="/polls">
                  <Trans t={t} i18nKey="viewAll" defaults="View All" />
                </Link>
              </Button>
            </CardContainerHeader>
            <CardContainerContent>
              {recentPolls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {recentPolls.map((poll) => (
                    <PollItem key={poll.id} pollId={poll.id}>
                      <PollItemIcon fromDate={poll.from} toDate={poll.to} />

                      <PollItemContent>
                        <PollItemTitle>{poll.title}</PollItemTitle>
                        <PollItemDetails>
                          <PollItemDateRange
                            from={poll.from}
                            to={poll.to}
                            optionsCount={poll.optionsCount}
                          />
                        </PollItemDetails>
                      </PollItemContent>
                      <div className="text-sm">
                        <Trans
                          t={t}
                          i18nKey="responsesReceived"
                          defaults="{participants, plural, one {1 response} other {# responses}}"
                          values={{ participants: poll.participants }}
                        />
                      </div>
                    </PollItem>
                  ))}
                </div>
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
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
