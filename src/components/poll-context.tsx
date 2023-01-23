import { Participant, Vote, VoteType } from "@prisma/client";
import { keyBy } from "lodash";
import { useTranslation } from "next-i18next";
import React from "react";

import Trash from "@/components/icons/trash.svg";
import {
  decodeOptions,
  getBrowserTimeZone,
  ParsedDateOption,
  ParsedTimeSlotOption,
} from "@/utils/date-time-utils";
import { GetPollApiResponse } from "@/utils/trpc/types";

import { useDayjs } from "../utils/dayjs";
import ErrorPage from "./error-page";
import { useParticipants } from "./participants-provider";
import { useRequiredContext } from "./use-required-context";
import { useUser } from "./user-provider";

type PollContextValue = {
  userAlreadyVoted: boolean;
  poll: GetPollApiResponse;
  urlId: string;
  admin: boolean;
  targetTimeZone: string;
  participantUrl: string;
  setTargetTimeZone: (timeZone: string) => void;
  pollType: "date" | "timeSlot";
  highScore: number;
  isDeleted: boolean;
  setDeleted: React.Dispatch<React.SetStateAction<boolean>>;
  optionIds: string[];
  // TODO (Luke Vella) [2022-05-18]: Move this stuff to participants provider
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
  poll: GetPollApiResponse;
  urlId: string;
  admin: boolean;
  children?: React.ReactNode;
}> = ({ poll, urlId, admin, children }) => {
  const { t } = useTranslation("app");
  const { participants } = useParticipants();
  const [isDeleted, setDeleted] = React.useState(false);
  const { user } = useUser();
  const [targetTimeZone, setTargetTimeZone] =
    React.useState(getBrowserTimeZone);

  const getScore = React.useCallback(
    (optionId: string) => {
      return (participants ?? []).reduce(
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
    [participants],
  );

  const { timeFormat } = useDayjs();

  const contextValue = React.useMemo<PollContextValue>(() => {
    const highScore = poll.options.reduce((acc, curr) => {
      const score = getScore(curr.id).yes;

      return score > acc ? score : acc;
    }, 1);

    const parsedOptions = decodeOptions(
      poll.options,
      poll.timeZone,
      targetTimeZone,
      timeFormat,
    );
    const getParticipantById = (participantId: string) => {
      // TODO (Luke Vella) [2022-04-16]: Build an index instead
      const participant = participants?.find(({ id }) => id === participantId);

      return participant;
    };

    const userAlreadyVoted =
      user && participants
        ? participants.some((participant) => participant.userId === user.id)
        : false;

    const optionIds = parsedOptions.options.map(({ optionId }) => optionId);

    const participantById = keyBy(
      participants,
      (participant) => participant.id,
    );

    const participantsByOptionId: Record<string, Participant[]> = {};
    poll.options.forEach((option) => {
      participantsByOptionId[option.id] = (participants ?? []).filter(
        (participant) =>
          participant.votes.some(
            ({ type, optionId }) => optionId === option.id && type === "yes",
          ),
      );
    });

    const { participantUrlId } = poll;

    const participantUrl = `${window.location.origin}/p/${participantUrlId}`;

    return {
      optionIds,
      userAlreadyVoted,
      poll,
      urlId,
      admin,
      participantUrl,
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
      isDeleted,
      setDeleted,
    };
  }, [
    admin,
    getScore,
    isDeleted,
    participants,
    poll,
    targetTimeZone,
    timeFormat,
    urlId,
    user,
  ]);

  if (isDeleted) {
    return (
      <ErrorPage
        icon={Trash}
        title={t("deletedPoll")}
        description={t("deletedPollInfo")}
      />
    );
  }
  return (
    <PollContext.Provider value={contextValue}>{children}</PollContext.Provider>
  );
};
