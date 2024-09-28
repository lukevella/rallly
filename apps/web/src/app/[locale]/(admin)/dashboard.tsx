"use client";

import { Button } from "@rallly/ui/button";
import Link from "next/link";

import { GroupPollCard } from "@/components/group-poll-card";
import { Subheading } from "@/components/heading";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild>
          <Link href="/new">Create a Poll</Link>
        </Button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Subheading>
            <Trans i18nKey="pending" defaults="Pending" />
          </Subheading>
          <Button asChild>
            <Link href="/polls">
              <Trans i18nKey="viewAll" defaults="View All" />
            </Link>
          </Button>
        </div>
        <PendingPolls />
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
          />
        );
      })}
    </div>
  );
}
