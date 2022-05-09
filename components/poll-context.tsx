import { Participant, Vote, VoteType } from "@prisma/client";
import { GetPollResponse } from "api-client/get-poll";
import { keyBy } from "lodash";
import React from "react";
import {
  decodeOptions,
  getBrowserTimeZone,
  ParsedDateOption,
  ParsedTimeSlotOption,
} from "utils/date-time-utils";

import { usePreferences } from "./preferences/use-preferences";
import { useSession } from "./session";
import { useRequiredContext } from "./use-required-context";

type PollContextValue = {
  userAlreadyVoted: boolean;
  poll: GetPollResponse;
  targetTimeZone: string;
  setTargetTimeZone: (timeZone: string) => void;
  pollType: "date" | "timeSlot";
  highScore: number;
  getParticipantsWhoVotedForOption: (optionId: string) => Participant[]; // maybe just attach votes to parsed options
  getScore: (optionId: string) => number;
  getParticipantById: (
    participantId: string,
  ) => (Participant & { votes: Vote[] }) | undefined;
  getVote: (participantId: string, optionId: string) => VoteType | undefined;
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
  const { user } = useSession();
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
  const { locale } = usePreferences();

  const getVotesForOption = React.useCallback(
    (optionId: string) => {
      // TODO (Luke Vella) [2022-04-16]: Build an index instead
      const option = poll.options.find(({ id }) => id === optionId);
      return option?.votes ?? [];
    },
    [poll.options],
  );

  const getScore = React.useCallback(
    (optionId: string) => {
      const votes = getVotesForOption(optionId);
      return votes.reduce((acc, curr) => {
        if (curr.type === "yes") {
          acc += 1;
        }
        return acc;
      }, 0);
    },
    [getVotesForOption],
  );

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
      locale,
    );
    const getParticipantById = (participantId: string) => {
      // TODO (Luke Vella) [2022-04-16]: Build an index instead
      const participant = poll.participants.find(
        ({ id }) => id === participantId,
      );

      return participant;
    };

    const userAlreadyVoted = user
      ? poll.participants.some((participant) =>
          user.isGuest
            ? participant.guestId === user.id
            : participant.userId === user.id,
        )
      : false;

    return {
      userAlreadyVoted,
      poll,
      getVotesForOption,
      getParticipantById: (participantId) => {
        return participantById[participantId];
      },
      highScore,
      getParticipantsWhoVotedForOption: (optionId: string) =>
        participantsByOptionId[optionId],
      getVote: (participantId, optionId) => {
        const vote = getParticipantById(participantId)?.votes.find(
          (vote) => vote.optionId === optionId,
        );
        return vote?.type;
      },
      getScore,
      ...parsedOptions,
      targetTimeZone,
      setTargetTimeZone,
    };
  }, [
    getScore,
    getVotesForOption,
    locale,
    participantById,
    participantsByOptionId,
    poll,
    targetTimeZone,
    user,
  ]);
  return (
    <PollContext.Provider value={contextValue}>{children}</PollContext.Provider>
  );
};
