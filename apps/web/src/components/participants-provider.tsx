import { trpc } from "@rallly/backend";
import { Participant, Vote, VoteType } from "@rallly/database";
import * as React from "react";

import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

import { useRequiredContext } from "./use-required-context";

const ParticipantsContext = React.createContext<{
  participants: Array<Participant & { votes: Vote[] }>;
  getParticipants: (optionId: string, voteType: VoteType) => Participant[];
} | null>(null);

export const useParticipants = () => {
  return useRequiredContext(ParticipantsContext);
};

export const ParticipantsProvider: React.FunctionComponent<{
  children?: React.ReactNode;
  pollId: string;
}> = ({ children, pollId }) => {
  const { data: participants } = trpc.polls.participants.list.useQuery(
    {
      pollId,
    },
    {
      staleTime: 1000 * 10,
      cacheTime: Infinity,
    },
  );

  const role = useRole();
  const poll = usePoll();

  const { user } = useUser();

  const filteredParticipants = React.useMemo(() => {
    if (!participants) {
      return [];
    }
    if (role === "participant" && poll.hideParticipants) {
      return participants.filter(
        (participant) => participant.userId === user.id,
      );
    }
    return participants;
  }, [participants, poll.hideParticipants, role, user.id]);

  const getParticipants = (
    optionId: string,
    voteType: VoteType,
  ): Participant[] => {
    if (!filteredParticipants) {
      return [];
    }
    return filteredParticipants.filter((participant) => {
      return participant.votes.some((vote) => {
        return vote.optionId === optionId && vote.type === voteType;
      });
    });
  };
  if (!participants) {
    return null;
  }

  return (
    <ParticipantsContext.Provider
      value={{ participants: filteredParticipants, getParticipants }}
    >
      {children}
    </ParticipantsContext.Provider>
  );
};
