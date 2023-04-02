import { trpc } from "@rallly/backend";
import { Participant, Vote, VoteType } from "@rallly/database";
import { useTranslation } from "next-i18next";
import * as React from "react";

import FullPageLoader from "./full-page-loader";
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
  const { t } = useTranslation("app");

  const { data: participants } = trpc.polls.participants.list.useQuery({
    pollId,
  });

  const getParticipants = (
    optionId: string,
    voteType: VoteType,
  ): Participant[] => {
    if (!participants) {
      return [];
    }
    return participants.filter((participant) => {
      return participant.votes.some((vote) => {
        return vote.optionId === optionId && vote.type === voteType;
      });
    });
  };

  // TODO (Luke Vella) [2022-05-18]: Add mutations here

  if (!participants) {
    return <FullPageLoader>{t("loadingParticipants")}</FullPageLoader>;
  }

  return (
    <ParticipantsContext.Provider value={{ participants, getParticipants }}>
      {children}
    </ParticipantsContext.Provider>
  );
};
