"use client";

import { cn } from "@rallly/ui";
import { Card } from "@rallly/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Link } from "@/components/link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PollOptionsList } from "@/features/poll/components/poll-options-list";
import { PollResponseActions } from "@/features/poll/components/poll-response-actions";
import VoteIcon from "@/features/poll/components/vote-icon";
import type { VoteType } from "@/features/poll/constants";
import { Trans } from "@/i18n/client";

function VoteLabel({ type }: { type?: VoteType }) {
  switch (type) {
    case "yes":
      return <Trans i18nKey="yes" defaults="Yes" />;
    case "ifNeedBe":
      return <Trans i18nKey="ifNeedBe" defaults="If need be" />;
    case "no":
      return <Trans i18nKey="no" defaults="No" />;
    default:
      return <Trans i18nKey="pollResponseDetailNoVote" defaults="No answer" />;
  }
}

/**
 * The card the detail pane shows, filling the pane and scrolling on its own,
 * whether it holds a response or an empty state.
 */
export function PollResponseDetailCard({
  children,
  header,
  className,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4 px-2 pt-0 pb-2 md:pl-0">
      {header}
      <Card className={cn("min-h-0 flex-1 overflow-y-auto p-5", className)}>
        {children}
      </Card>
    </div>
  );
}

export function PollResponseDetail({
  pollId,
  pollOpen,
  kind,
  timeZone,
  response,
  options,
  activity,
}: {
  pollId: string;
  pollOpen: boolean;
  kind: "date" | "time";
  timeZone: string | null;
  response: {
    id: string;
    name: string;
    email: string | null;
    note: string | null;
    image: string | null;
    createdAt: Date;
    editUrl: string;
    votes: { optionId: string; type: VoteType }[];
  };
  options: { id: string; startTime: Date; duration: number }[];
  activity: React.ReactNode;
}) {
  const router = useRouter();
  const voteByOptionId = React.useMemo(
    () => new Map(response.votes.map((vote) => [vote.optionId, vote.type])),
    [response.votes],
  );
  const renderVote = React.useCallback(
    (option: { id: string }) => {
      const type = voteByOptionId.get(option.id);
      return (
        <span className="flex items-center gap-2 text-muted-foreground text-sm">
          <VoteIcon type={type} size="sm" />
          <VoteLabel type={type} />
        </span>
      );
    },
    [voteByOptionId],
  );

  return (
    <PollResponseDetailCard
      className="space-y-8"
      header={
        <Link
          href={`/polls/${pollId}/responses`}
          scroll={false}
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground md:hidden"
        >
          <ArrowLeftIcon className="size-4" />
          <Trans i18nKey="responses" defaults="Responses" />
        </Link>
      }
    >
      <div className="flex items-start gap-3">
        <OptimizedAvatarImage
          size="lg"
          name={response.name}
          src={response.image ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-base">{response.name}</h2>
          <p className="truncate text-muted-foreground text-sm">
            {response.email || (
              <i>
                <Trans
                  i18nKey="pollResponseDetailNoEmail"
                  defaults="No email provided"
                />
              </i>
            )}
          </p>
        </div>
        <PollResponseActions
          participantId={response.id}
          participantName={response.name}
          editUrl={response.editUrl}
          pollOpen={pollOpen}
          onDelete={() => router.replace(`/polls/${pollId}/responses`)}
        />
      </div>
      {response.note ? (
        <section className="space-y-2">
          <h3 className="font-medium text-sm">
            <Trans i18nKey="pollResponseDetailNote" defaults="Note" />
          </h3>
          <p className="whitespace-pre-wrap break-words rounded-lg border bg-card px-3 py-2 text-sm">
            {response.note}
          </p>
        </section>
      ) : null}
      <section className="space-y-2">
        <h3 className="font-medium text-sm">
          <Trans
            i18nKey="pollResponseDetailAvailability"
            defaults="Availability"
          />
        </h3>
        <PollOptionsList
          kind={kind}
          options={options}
          timeZone={timeZone}
          renderValue={renderVote}
          className="-mx-4 py-0"
        />
      </section>
      <section className="space-y-2">
        <h3 className="font-medium text-sm">
          <Trans i18nKey="pollResponseDetailActivity" defaults="Activity" />
        </h3>
        {activity}
      </section>
    </PollResponseDetailCard>
  );
}
