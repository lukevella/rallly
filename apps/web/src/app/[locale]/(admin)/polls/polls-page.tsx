"use client";
import { Button } from "@rallly/ui/button";
import dayjs from "dayjs";
import {
  InboxIcon,
  PauseCircleIcon,
  PlusIcon,
  RadioIcon,
  VoteIcon,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
import { DateIcon } from "@/components/date-icon";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollStatusBadge } from "@/components/poll-status";
import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { useDayjs } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

const EmptyState = () => {
  return (
    <div className="p-8 lg:p-36">
      <div className="mx-auto max-w-lg rounded-md border-2 border-dashed border-gray-300 p-8 text-center text-gray-600">
        <div className="mb-4">
          <InboxIcon className="inline-block h-10 w-10 text-gray-500" />
        </div>
        <h3>
          <Trans i18nKey="noPolls" defaults="No polls" />
        </h3>
        <p>
          <Trans
            i18nKey="noPollsDescription"
            defaults="Get started by creating a new poll."
          />
        </p>
        <div className="mt-6">
          <Button variant="primary" asChild={true}>
            <Link href="/new">
              <PlusIcon className="h-5 w-5" />
              <Trans defaults="New Poll" i18nKey="newPoll" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export function PollsPage() {
  const { data } = trpc.polls.list.useQuery();
  const { adjustTimeZone } = useDayjs();

  return (
    <div>
      <TopBar className="flex items-center justify-between gap-4">
        <TopBarTitle title={<Trans i18nKey="polls" />} icon={VoteIcon} />
        <div>
          <Button variant="primary" asChild={true}>
            <Link href="/new">
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              <Trans defaults="New Poll" i18nKey="newPoll" />
            </Link>
          </Button>
        </div>
      </TopBar>
      <div>
        <Container className="mx-auto p-3 sm:p-8">
          {data ? (
            data.length > 0 ? (
              <div className="mx-auto grid max-w-3xl gap-3 sm:gap-4">
                {data.map((poll) => {
                  const { title, id: pollId, createdAt, closed: paused } = poll;
                  const status = poll.event
                    ? "closed"
                    : paused
                    ? "paused"
                    : "live";
                  return (
                    <div
                      key={poll.id}
                      className="flex overflow-hidden rounded-md border shadow-sm"
                    >
                      <div className="flex grow flex-col-reverse justify-between gap-x-4 gap-y-4 bg-white p-4 sm:flex-row sm:items-start sm:px-6">
                        <div className="flex gap-x-4">
                          <div className="sm:-ml-2">
                            {poll.event ? (
                              <DateIcon
                                date={adjustTimeZone(
                                  poll.event.start,
                                  !poll.timeZone,
                                )}
                              />
                            ) : (
                              <div className="inline-flex h-14 w-14 items-center justify-center rounded-md border bg-gray-50 text-gray-400">
                                {status === "live" ? (
                                  <RadioIcon className="h-5 w-5" />
                                ) : (
                                  <PauseCircleIcon className="h-5 w-5" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              {poll.event
                                ? poll.event.duration > 0
                                  ? `${adjustTimeZone(
                                      poll.event.start,
                                      !poll.timeZone,
                                    ).format("LL LT")} - ${adjustTimeZone(
                                      dayjs(poll.event.start).add(
                                        poll.event.duration,
                                        "minutes",
                                      ),
                                      !poll.timeZone,
                                    ).format("LT")}`
                                  : adjustTimeZone(
                                      poll.event.start,
                                      !poll.timeZone,
                                    ).format("LL")
                                : null}
                            </div>
                            <div>
                              <Link
                                href={`/poll/${pollId}`}
                                className="text-lg font-semibold tracking-tight hover:underline"
                              >
                                {title}
                              </Link>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              <Trans
                                i18nKey="createdTime"
                                defaults="Created {relativeTime}"
                                values={{
                                  relativeTime: dayjs(createdAt).fromNow(),
                                }}
                              />
                            </div>
                            {poll.participants.length > 0 ? (
                              <div className="mt-4">
                                <ParticipantAvatarBar
                                  participants={poll.participants}
                                  max={5}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <PollStatusBadge status={status} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="mx-auto grid max-w-3xl gap-3 sm:gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}
