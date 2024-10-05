"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  BarChart2Icon,
  BookIcon,
  CalendarIcon,
  CalendarPlusIcon,
  PlusIcon,
  TableIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

import { CreateButton } from "@/app/[locale]/(admin)/create-button";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { GridCard, GridCardHeader } from "@/components/grid-card";
import { GroupPollCard } from "@/components/group-poll-card";
import { Subheading } from "@/components/heading";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { useLocalizeTime } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

const SectionHeading = ({ children }: React.PropsWithChildren) => {
  return <div className="flex items-center justify-between">{children}</div>;
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Subheading>
          <Trans i18nKey="create" defaults="Create" />
        </Subheading>
        <div className="scrollbar-none -mx-6 flex gap-2 overflow-x-auto whitespace-nowrap px-6">
          <CreateButton
            variant="purple"
            href="/new"
            icon={<BarChart2Icon className="size-5" />}
            label={<Trans i18nKey="groupPoll" defaults="Group Poll" />}
          />
          <CreateButton
            variant="violet"
            href="/new"
            icon={<UserIcon className="size-5" />}
            label={<Trans i18nKey="oneOnOne" defaults="One-on-One" />}
          />
          <CreateButton
            variant="indigo"
            href="/new"
            icon={<BookIcon className="size-5" />}
            label={<Trans i18nKey="bookingPage" defaults="Booking Page" />}
          />
          <CreateButton
            variant="pink"
            href="/new"
            icon={<TableIcon className="size-5" />}
            label={<Trans i18nKey="signUpSheet" defaults="Sign Up Sheet" />}
          />
        </div>
      </div>
      <div className="space-y-4">
        <SectionHeading>
          <Subheading>
            <Trans i18nKey="pending" defaults="Pending" />
          </Subheading>
          <Button variant="ghost" asChild>
            <Link href="/polls">
              <Trans i18nKey="viewAll" defaults="View All" />
            </Link>
          </Button>
        </SectionHeading>
        <PendingPolls />
      </div>
      <div className="space-y-4">
        <SectionHeading>
          <Subheading>
            <Trans i18nKey="upcoming" defaults="Upcoming" />
          </Subheading>
          <Button variant="ghost" asChild>
            <Link href="/events">
              <Trans i18nKey="viewAll" defaults="View All" />
            </Link>
          </Button>
        </SectionHeading>
        <UpcomingEvents />
      </div>
    </div>
  );
}

function PendingPolls() {
  const { data } = trpc.dashboard.getPending.useQuery(undefined, {
    suspense: true,
  });

  if (!data) {
    return <Spinner />;
  }

  if (data.length === 0) {
    return (
      <EmptyState className="h-96 rounded-lg">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="pendingPollsEmptyStateTitle"
            defaults="No Pending Polls"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="pendingPollsEmptyStateDescription"
            defaults="When you create polls, they will appear here."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {data.map((poll) => {
        return (
          <GroupPollCard
            key={poll.id}
            pollId={poll.id}
            title={poll.title}
            status={poll.status}
            inviteLink={poll.inviteLink}
            responseCount={poll.responseCount}
            dateStart={poll.range.start}
            dateEnd={poll.range.end}
            timeZone={poll.timeZone ?? undefined}
          />
        );
      })}
    </div>
  );
}

function UpcomingEvents() {
  const { data } = trpc.dashboard.getUpcoming.useQuery(undefined, {
    suspense: true,
  });

  const localizeTime = useLocalizeTime();

  if (!data) {
    return <Spinner />;
  }

  if (data.length === 0) {
    return (
      <EmptyState className="h-96 rounded-lg">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="upcomingEventsEmptyStateTitle"
            defaults="No Upcoming Events"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="upcomingEventsEmptyStateDescription"
            defaults="When you schedule events, they will appear here."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.map((event) => {
        return (
          <GridCard key={event.id}>
            <GridCardHeader className="flex gap-2">
              <div>
                <div className="bg-primary-600 text-primary-100 inline-flex items-center justify-center rounded-md p-1.5">
                  <CalendarIcon className="size-5" />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{event.title}</h3>
                <time
                  className="text-muted-foreground whitespace-nowrap"
                  dateTime={event.start.toISOString()}
                >
                  {localizeTime(event.start, !event.timeZone).format("DD MMM")}
                </time>
              </div>
            </GridCardHeader>
          </GridCard>
        );
      })}
    </div>
  );
}
