import { Participant, Vote, VoteType } from "@rallly/database";
import { TrashIcon } from "@rallly/icons";
import dayjs, { Dayjs } from "dayjs";
import { keyBy } from "lodash";
import { useTranslation } from "next-i18next";
import React from "react";

import { useTimeFormat, useTimeZone } from "@/contexts/time-preferences";
import {
  decodeOptions,
  parseDateOption,
  ParsedDateOption,
  ParsedTimeSlotOption,
} from "@/utils/date-time-utils";
import { GetPollApiResponse } from "@/utils/trpc/types";

import ErrorPage from "./error-page";
import { useParticipants } from "./participants-provider";
import { useRequiredContext } from "./use-required-context";
import { useUser } from "./user-provider";

type PollContextValue = {
  userAlreadyVoted: boolean;
  poll: GetPollApiResponse;
  urlId: string;
  admin: boolean;
  pollType: "date" | "timeSlot";
  highScore: number;
  optionIds: string[];
  // TODO (Luke Vella) [2022-05-18]: Move this stuff to participants provider
  getParticipantsWhoVotedForOption: (optionId: string) => Participant[]; // maybe just attach votes to parsed options
  getScore: (optionId: string) => { yes: number; ifNeedBe: number };
  getParticipantById: (
    participantId: string,
  ) => (Participant & { votes: Vote[] }) | undefined;
  getVote: (participantId: string, optionId: string) => VoteType | undefined;
};

export const PollContext = React.createContext<PollContextValue | null>(null);

PollContext.displayName = "PollContext.Provider";

export const usePoll = () => {
  const context = useRequiredContext(PollContext);
  return context;
};

export const PollContextProvider: React.FunctionComponent<{
  poll: GetPollApiResponse;
  urlId: string;
  admin: boolean;
  children?: React.ReactNode;
}> = ({ poll, urlId, admin, children }) => {
  const { t } = useTranslation();
  const { participants } = useParticipants();
  const { user, ownsObject } = useUser();

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
            if (vote.type === "no") {
              acc.no += 1;
            }
          });
          return acc;
        },
        { yes: 0, ifNeedBe: 0, no: 0 },
      );
    },
    [participants],
  );

  const contextValue = React.useMemo<PollContextValue>(() => {
    const highScore = poll.options.reduce((acc, curr) => {
      const score = getScore(curr.id).yes;

      return score > acc ? score : acc;
    }, 1);

    const getParticipantById = (participantId: string) => {
      // TODO (Luke Vella) [2022-04-16]: Build an index instead
      const participant = participants?.find(({ id }) => id === participantId);

      return participant;
    };

    const userAlreadyVoted =
      user && participants ? participants.some(ownsObject) : false;

    const optionIds = poll.options.map(({ id }) => id);

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

    return {
      optionIds,
      userAlreadyVoted,
      poll,
      urlId,
      admin,
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
    };
  }, [admin, getScore, ownsObject, participants, poll, urlId, user]);

  if (poll.deleted) {
    return (
      <ErrorPage
        icon={TrashIcon}
        title={t("deletedPoll")}
        description={t("deletedPollInfo")}
      />
    );
  }
  return (
    <PollContext.Provider value={contextValue}>{children}</PollContext.Provider>
  );
};

export const useAdjustTimeZone = () => {
  const { poll } = usePoll();
  const [targetTimeZone] = useTimeZone();
  return (date: Date) => {
    const d = dayjs(date).utc();
    if (poll.timeZone) {
      return d.tz(poll.timeZone, true).tz(targetTimeZone);
    } else {
      return d;
    }
  };
};

export const TimeFormatter = ({ date }: { date: Dayjs }) => {
  const [timeFormat] = useTimeFormat();

  return (
    <>{dayjs(date).format(timeFormat === "hours12" ? "h:mm A" : "HH:mm")}</>
  );
};

const OptionsContext = React.createContext<
  | {
      pollType: "date";
      options: ParsedDateOption[];
    }
  | {
      pollType: "timeSlot";
      options: ParsedTimeSlotOption[];
    }
>({
  pollType: "date",
  options: [],
});

export const useOptions = () => {
  const context = React.useContext(OptionsContext);
  return context;
};

export const OptionsProvider = (props: React.PropsWithChildren) => {
  const { poll } = usePoll();
  const [targetTimeZone] = useTimeZone();
  const [timeFormat] = useTimeFormat();
  const parsedDateOptions = decodeOptions(
    poll.options,
    poll.timeZone,
    targetTimeZone,
    timeFormat,
  );
  return (
    <OptionsContext.Provider value={parsedDateOptions}>
      {props.children}
    </OptionsContext.Provider>
  );
};
