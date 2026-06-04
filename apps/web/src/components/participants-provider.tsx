import type { VoteType } from "@rallly/database";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { useVisibility } from "@/components/visibility";
import { usePermissions } from "@/contexts/permissions";
import { useTranslation } from "@/i18n/client";
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
  const { t } = useTranslation();
  const urlId = useParams<{ urlId: string }>().urlId;
  const token = useSearchParams().get("token") ?? undefined;
  const [rawParticipants] = trpc.polls.participants.list.useSuspenseQuery({
    pollId: urlId,
    token,
  });

  const participants = React.useMemo(() => {
    return rawParticipants.map((participant, index) => {
      if (!participant.hidden) {
        return participant;
      }

      return {
        ...participant,
        name: t("hiddenParticipantName", {
          defaultValue: "Participant #{number}",
          number: rawParticipants.length - index,
        }),
      };
    });
  }, [rawParticipants, t]);

  return { participants };
};

export const useVisibleParticipants = () => {
  const { canSeeScores } = useVisibility();
  const { canEditParticipant } = usePermissions();
  const { participants } = useParticipants();

  const filteredParticipants = React.useMemo(() => {
    if (!canSeeScores) {
      return participants.filter((participant) =>
        canEditParticipant(participant.id),
      );
    }
    return participants;
  }, [canEditParticipant, canSeeScores, participants]);

  return filteredParticipants;
};
