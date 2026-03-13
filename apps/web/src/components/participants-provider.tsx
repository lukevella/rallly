import type { VoteType } from "@rallly/database";
import { useParams } from "next/navigation";
import * as React from "react";
import { useVisibility } from "@/components/visibility";
import { usePermissions } from "@/contexts/permissions";
import { trpc } from "@/trpc/client";

export function filterParticipantsByVote<
  T extends { votes: { optionId: string; type: VoteType }[] },
>(participants: T[], optionId: string, voteType: VoteType): T[] {
  return participants.filter((participant) => {
    return participant.votes.some((vote) => {
      return vote.optionId === optionId && vote.type === voteType;
    });
  });
}

export const useParticipants = () => {
  const urlId = useParams<{ urlId: string }>().urlId;
  const [participants] = trpc.polls.participants.list.useSuspenseQuery({
    pollId: urlId,
  });

  return { participants };
};

export const useVisibleParticipants = () => {
  const { canSeeOtherParticipants } = useVisibility();
  const { canEditParticipant } = usePermissions();
  const { participants } = useParticipants();

  const filteredParticipants = React.useMemo(() => {
    if (!canSeeOtherParticipants) {
      return participants.filter((participant) =>
        canEditParticipant(participant.id),
      );
    }
    return participants;
  }, [canEditParticipant, canSeeOtherParticipants, participants]);

  return filteredParticipants;
};
