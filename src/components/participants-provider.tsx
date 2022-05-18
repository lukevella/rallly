import { Participant, Vote } from "@prisma/client";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { trpc } from "../utils/trpc";
import FullPageLoader from "./full-page-loader";
import { useRequiredContext } from "./use-required-context";

const ParticipantsContext =
  React.createContext<{
    participants: Array<Participant & { votes: Vote[] }>;
  } | null>(null);

export const useParticipants = () => {
  return useRequiredContext(ParticipantsContext);
};

export const ParticipantsProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  pollId: string;
}> = ({ children, pollId }) => {
  const { t } = useTranslation("app");

  const { data: participants } = trpc.useQuery([
    "polls.participants.list",
    { pollId },
  ]);

  // TODO (Luke Vella) [2022-05-18]: Add mutations here

  if (!participants) {
    return <FullPageLoader>{t("loadingParticipants")}</FullPageLoader>;
  }

  return (
    <ParticipantsContext.Provider value={{ participants }}>
      {children}
    </ParticipantsContext.Provider>
  );
};
