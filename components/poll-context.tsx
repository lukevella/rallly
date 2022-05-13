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
  getScore: (optionId: string) => { yes: number; ifNeedBe: number };
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
      res[option.id] = poll.participants.filter((participant) =>
        participant.votes.some(
          ({ type, optionId }) => optionId === option.id && type !== "no",
        ),
      );
    });
    return res;
  }, [poll.options, poll.participants]);

  const { locale } = usePreferences();

  const getScore = React.useCallback(
    (optionId: string) => {
      return poll.participants.reduce(
        (acc, curr) => {
          curr.votes.forEach((vote) => {
            if (vote.optionId !== optionId) {
              return;
            }
            if (vote.type === "yes") {
              acc.yes += 1;
            }
            if (vote.type === "ifNeedBe") {
              acc.ifNeedBe += 1;
            }
          });
          return acc;
        },
        { yes: 0, ifNeedBe: 0 },
      );
    },
    [poll.participants],
  );

  const contextValue = React.useMemo<PollContextValue>(() => {
    const highScore = poll.options.reduce((acc, curr) => {
      const score = getScore(curr.id).yes;

      return score > acc ? score : acc;
    }, 1);

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
