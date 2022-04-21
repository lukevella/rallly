import { Participant, Vote } from "@prisma/client";
import { GetPollResponse } from "api-client/get-poll";
import { keyBy } from "lodash";
import React from "react";
import {
  decodeOptions,
  getBrowserTimeZone,
  ParsedDateOption,
  ParsedTimeSlotOption,
} from "utils/date-time-utils";

import { useRequiredContext } from "./use-required-context";

type VoteType = "yes" | "no";

type PollContextValue = {
  poll: GetPollResponse;
  targetTimeZone: string;
  setTargetTimeZone: (timeZone: string) => void;
  pollType: "date" | "timeSlot";
  highScore: number;
  getParticipantsWhoVotedForOption: (optionId: string) => Participant[]; // maybe just attach votes to parsed options
  getParticipantById: (
    participantId: string,
  ) => (Participant & { votes: Vote[] }) | undefined;
  getVote: (participantId: string, optionId: string) => VoteType;
} & (
  | { pollType: "date"; options: ParsedDateOption[] }
  | { pollType: "timeSlot"; options: ParsedTimeSlotOption[] }
);

export const PollContext = React.createContext<PollContextValue | null>(null);

PollContext.displayName = "PollContext.Provider";

export const usePoll = () => {
  const context = useRequiredContext(PollContext);
  return context;
};

export const PollContextProvider: React.VoidFunctionComponent<{
  value: GetPollResponse;
  children?: React.ReactNode;
}> = ({ value: poll, children }) => {
  const [targetTimeZone, setTargetTimeZone] =
    React.useState(getBrowserTimeZone);

  const participantById = React.useMemo(
    () => keyBy(poll.participants, (participant) => participant.id),
    [poll.participants],
  );

  const participantsByOptionId = React.useMemo(() => {
    const res: Record<string, Participant[]> = {};
    poll.options.forEach((option) => {
      res[option.id] = option.votes.map(
        ({ participantId }) => participantById[participantId],
      );
    });
    return res;
  }, [participantById, poll.options]);

  const contextValue = React.useMemo<PollContextValue>(() => {
    let highScore = 1;
    poll.options.forEach((option) => {
      if (option.votes.length > highScore) {
        highScore = option.votes.length;
      }
    });

    const parsedOptions = decodeOptions(
      poll.options,
      poll.timeZone,
      targetTimeZone,
    );
    const getParticipantById = (participantId: string) => {
      // TODO (Luke Vella) [2022-04-16]: Build an index instead
      const participant = poll.participants.find(
        ({ id }) => id === participantId,
      );

      return participant;
    };

    return {
      poll,
      getVotesForOption: (optionId: string) => {
        // TODO (Luke Vella) [2022-04-16]: Build an index instead
        const option = poll.options.find(({ id }) => id === optionId);
        return option?.votes ?? [];
      },
      getParticipantById: (participantId) => {
        return participantById[participantId];
      },
      highScore,
      getParticipantsWhoVotedForOption: (optionId: string) =>
        participantsByOptionId[optionId],
      getVote: (participantId, optionId) => {
        return getParticipantById(participantId)?.votes.some(
          (vote) => vote.optionId === optionId,
        )
          ? "yes"
          : "no";
      },
      ...parsedOptions,
      targetTimeZone,
      setTargetTimeZone,
    };
  }, [participantById, participantsByOptionId, poll, targetTimeZone]);
  return (
    <PollContext.Provider value={contextValue}>{children}</PollContext.Provider>
  );
};
