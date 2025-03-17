"use client";

import { PollCard as ComposablePollCard } from "./poll-item/poll-card";

export function PollCard({
  pollId,
  title,
  createdAt,
  from,
  to,
  participants,
  location,
  optionsCount,
  participantsList = [],
}: {
  pollId: string;
  title: string;
  createdAt: Date;
  from: Date;
  to: Date;
  participants: number;
  location: string | null;
  optionsCount: number;
  participantsList?: {
    id: string;
    name: string;
    user: {
      image: string | null;
    } | null;
  }[];
}) {
  return (
    <ComposablePollCard
      pollId={pollId}
      title={title}
      createdAt={createdAt}
      from={from}
      to={to}
      participants={participants}
      location={location}
      optionsCount={optionsCount}
      participantsList={participantsList}
    />
  );
}
