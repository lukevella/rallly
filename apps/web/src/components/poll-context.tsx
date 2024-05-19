import { Participant, VoteType } from "@rallly/database";
import dayjs from "dayjs";
import { keyBy } from "lodash";
import { TrashIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import React from "react";

import {
  getDuration,
  ParsedDateOption,
  ParsedTimeSlotOption,
} from "@/utils/date-time-utils";
import { useDayjs } from "@/utils/dayjs";
import { GetPollApiResponse, Vote } from "@/utils/trpc/types";

import ErrorPage from "./error-page";
import { useParticipants } from "./participants-provider";
import { useRequiredContext } from "./use-required-context";

type PollContextValue = {
  poll: GetPollApiResponse;
  urlId: string;
  admin: boolean;
  highScore: number;
  optionIds: string[];
  // TODO (Luke Vella) [2022-05-18]: Move this stuff to participants provider
  getParticipantsWhoVotedForOption: (optionId: string) => Participant[]; // maybe just attach votes to parsed options
  getScore: (optionId: string) => {
    yes: number;
    ifNeedBe: number;
    no: number;
    skip: number;
  };
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
            } else if (vote.type === "ifNeedBe") {
              acc.ifNeedBe += 1;
            } else if (vote.type === "no") {
              acc.no += 1;
            } else {
              acc.skip += 1;
            }
          });
          return acc;
        },
        { yes: 0, ifNeedBe: 0, no: 0, skip: 0 },
      );
    },
    [participants],
  );

  const contextValue = React.useMemo<PollContextValue>(() => {
    const highScore = poll.options.reduce((acc, curr) => {
      const { yes, ifNeedBe } = getScore(curr.id);
      const score = yes + ifNeedBe;
      return score > acc ? score : acc;
    }, 1);

    const getParticipantById = (participantId: string) => {
      // TODO (Luke Vella) [2022-04-16]: Build an index instead
      const participant = participants?.find(({ id }) => id === participantId);

      return participant;
    };

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
  }, [admin, getScore, participants, poll, urlId]);

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

type OptionsContextValue =
  | {
      pollType: "date";
      options: ParsedDateOption[];
    }
  | {
      pollType: "timeSlot";
      options: ParsedTimeSlotOption[];
    };

const OptionsContext = React.createContext<OptionsContextValue>({
  pollType: "date",
  options: [],
});

export const useOptions = () => {
  const context = React.useContext(OptionsContext);
  return context;
};

function createOptionsContextValue(
  pollOptions: { id: string; startTime: Date; duration: number }[],
  targetTimeZone: string,
  sourceTimeZone: string | null,
): OptionsContextValue {
  if (pollOptions.length === 0) {
    return {
      pollType: "date",
      options: [],
    };
  }
  if (pollOptions[0].duration > 0) {
    return {
      pollType: "timeSlot",
      options: pollOptions.map((option) => {
        function adjustTimeZone(date: Date) {
          if (sourceTimeZone) {
            return dayjs(date).tz(targetTimeZone);
          }
          return dayjs(date).utc();
        }
        const localStartTime = adjustTimeZone(option.startTime);

        // for some reason, dayjs requires us to do timezone conversion at the end
        const localEndTime = adjustTimeZone(
          dayjs(option.startTime).add(option.duration, "minute").toDate(),
        );

        return {
          optionId: option.id,
          type: "timeSlot",
          startTime: localStartTime.format("LT"),
          endTime: localEndTime.format("LT"),
          duration: getDuration(localStartTime, localEndTime),
          month: localStartTime.format("MMM"),
          day: localStartTime.format("D"),
          dow: localStartTime.format("ddd"),
          year: localStartTime.format("YYYY"),
        } satisfies ParsedTimeSlotOption;
      }),
    };
  } else {
    return {
      pollType: "date",
      options: pollOptions.map((option) => {
        const localTime = sourceTimeZone
          ? dayjs(option.startTime).tz(targetTimeZone)
          : dayjs(option.startTime).utc();

        return {
          optionId: option.id,
          type: "date",
          month: localTime.format("MMM"),
          day: localTime.format("D"),
          dow: localTime.format("ddd"),
          year: localTime.format("YYYY"),
        } satisfies ParsedDateOption;
      }),
    };
  }
}

export const OptionsProvider = (props: React.PropsWithChildren) => {
  const { poll } = usePoll();
  const { timeZone: targetTimeZone, timeFormat } = useDayjs();

  const options = React.useMemo(() => {
    return createOptionsContextValue(
      poll.options,
      targetTimeZone,
      poll.timeZone,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.options, poll.timeZone, targetTimeZone, timeFormat]);

  return (
    <OptionsContext.Provider value={options}>
      {props.children}
    </OptionsContext.Provider>
  );
};
