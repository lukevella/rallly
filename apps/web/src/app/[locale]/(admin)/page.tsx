import {
  ArrowRightSquareIcon,
  ArrowUpRightFromSquareIcon,
  DotIcon,
  HomeIcon,
  InboxIcon,
} from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import Link from "next/link";
import type { Params } from "@/app/[locale]/types";
import { Icon } from "@rallly/ui/icon";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";
import { prisma } from "@rallly/database";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { LocalTime } from "@/components/local-time";
import { FormattedDate } from "@/components/formatted-date";
import { Button } from "@rallly/ui/button";
import { PollCard } from "@/components/poll-card";
import { notFound } from "next/navigation";
import { options } from "i18next-scanner.config";

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
          name: true,
          user: {
            select: {
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          comments: true,
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
      from: poll.options[0].startTime,
      to: lastOption.startTime,
      participants: poll._count.participants,
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
        <PageContent className="grid gap-4 lg:grid-cols-2">
          <div className="relative flex flex-col items-center justify-center rounded-lg border p-8 text-center">
            <div>
              <OptimizedAvatarImage
                className="mx-auto mb-4"
                src={user.image ?? undefined}
                name={user.name ?? "Guest"}
                size="xl"
              />
              <div className="text-xl font-bold tracking-tight">
                {user.name}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                <div>{user.timeZone}</div>
                <DotIcon className="size-4" />
                <div>
                  <LocalTime />
                </div>
              </div>
              <div className="mt-6">
                <div className="inline-flex items-center gap-4 rounded-lg bg-gray-100 p-1 pl-4">
                  https://rallly.co/lukevella
                  <Button size="sm" variant="primary" asChild>
                    <Link href={`/${user.id}`}>
                      <Icon>
                        <ArrowUpRightFromSquareIcon />
                      </Icon>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                <Trans t={t} i18nKey="pendingEvents" defaults="Pending" />
              </h3>
              <Button variant="ghost" asChild>
                <Link href="/polls">
                  <Trans t={t} i18nKey="viewAll" defaults="View All" />
                </Link>
              </Button>
            </div>
            <div>
              {recentPolls.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {recentPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      pollId={poll.id}
                      title={poll.title}
                      createdAt={poll.createdAt}
                      from={poll.from}
                      to={poll.to}
                      participants={poll.participants}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Trans t={t} i18nKey="noPolls" defaults="No polls" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                <Trans t={t} i18nKey="upcomingEvents" defaults="Upcoming" />
              </h3>
              <Button variant="ghost" asChild>
                <Link href="/events">
                  <Trans t={t} i18nKey="viewAll" defaults="View All" />
                </Link>
              </Button>
            </div>
            <div>
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
                <div className="text-muted-foreground b flex h-32 items-center justify-center p-4 text-center">
                  <Trans t={t} i18nKey="noEvents" defaults="No events" />
                </div>
              )}
            </div>
          </div>
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
