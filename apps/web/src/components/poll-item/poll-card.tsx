"use client";

import {
  PollItem,
  PollItemContent,
  PollItemDateRange,
  PollItemDetails,
  PollItemIcon,
  PollItemLocation,
  PollItemParticipants,
  PollItemTitle,
} from ".";

export function PollCard({
  pollId,
  title,
  from,
  to,
  participants,
  location,
  optionsCount,
  participantsList,
}: {
  pollId: string;
  title: string;
  createdAt: Date;
  from: Date;
  to: Date;
  participants: number;
  location: string | null;
  optionsCount: number;
  participantsList: {
    id: string;
    name: string;
    user: {
      image: string | null;
    } | null;
  }[];
}) {
  return (
    <PollItem pollId={pollId}>
      <PollItemIcon fromDate={from} toDate={to} />
      
      <PollItemContent>
        <PollItemTitle>{title}</PollItemTitle>
        
        <PollItemDetails>
          {location && <PollItemLocation location={location} />}
          <PollItemDateRange from={from} to={to} optionsCount={optionsCount} />
        </PollItemDetails>
      </PollItemContent>
      
      <PollItemParticipants 
        participants={participants} 
        participantsList={participantsList || []} 
      />
    </PollItem>
  );
}
