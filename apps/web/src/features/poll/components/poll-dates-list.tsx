"use client";

import { CalendarIcon } from "lucide-react";
import React from "react";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { PollOptionsList } from "@/features/poll/components/poll-options-list";
import { VoteBar } from "@/features/poll/components/vote-bar";
import type { VoteType } from "@/features/poll/constants";
import { Trans } from "@/i18n/client";

type DateRow = {
  id: string;
  startTime: Date;
  duration: number;
  votes: { type: VoteType; count: number }[];
};

export function PollDatesList({
  kind,
  options,
  participantCount,
  timeZone,
}: {
  kind: "date" | "time";
  options: DateRow[];
  participantCount: number;
  timeZone: string | null;
}) {
  const renderValue = React.useCallback(
    (option: DateRow) => {
      const count = (type: VoteType) =>
        option.votes.find((vote) => vote.type === type)?.count ?? 0;
      return (
        <VoteBar
          className="w-16"
          yes={count("yes")}
          ifNeedBe={count("ifNeedBe")}
          total={participantCount}
        />
      );
    },
    [participantCount],
  );

  if (options.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="pollDatesListEmpty" defaults="No dates" />
        </EmptyStateTitle>
      </EmptyState>
    );
  }

  return (
    <PollOptionsList
      kind={kind}
      options={options}
      timeZone={timeZone}
      renderValue={renderValue}
    />
  );
}
