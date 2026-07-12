import type { TimeFormat, VoteType } from "@rallly/database";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import { useParticipants } from "@/features/poll/components/participants-provider";
import { useDateTimeConfig } from "@/lib/datetime/client";
import {
  formatDateParts,
  formatDateTime,
  formatDuration,
} from "@/lib/datetime/format";
import type {
  ParsedDateOption,
  ParsedTimeSlotOption,
} from "@/lib/utils/date-time-utils";
import type { GetPollApiResponse } from "@/trpc/client/types";

type PollContextValue = {
  poll: GetPollApiResponse;
  highScore: number;
  optionIds: string[];
  getScore: (optionId: string) => {
    yes: number;
    ifNeedBe: number;
    no: number;
    skip: number;
  };
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
  children?: React.ReactNode;
}> = ({ poll, children }) => {
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

    const optionIds = poll.options.map(({ id }) => id);

    return {
      optionIds,
      poll,
      highScore,
      getVote: (participantId, optionId) => {
        const vote = participants
          .find((participant) => participant.id === participantId)
          ?.votes.find((vote) => vote.optionId === optionId);
        return vote?.type;
      },
      getScore,
    };
  }, [getScore, participants, poll]);

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

export function createOptionsContextValue({
  pollOptions,
  pollTimeZone,
  locale,
  timeZone,
  timeFormat,
}: {
  pollOptions: { id: string; startTime: Date; duration: number }[];
  /**
   * The poll's zone: set means options are fixed instants shown in the
   * viewer's zone; null means floating times shown as stored.
   */
  pollTimeZone: string | null;
  locale: string;
  /** The viewer's zone; undefined falls back to the system zone. */
  timeZone?: string;
  timeFormat?: TimeFormat;
}): OptionsContextValue {
  if (pollOptions.length === 0) {
    return {
      pollType: "date",
      options: [],
    };
  }
  if (pollOptions[0].duration > 0) {
    // Floating times are stored as UTC wall times, so reading them in UTC
    // shows them unshifted.
    const displayTimeZone = pollTimeZone ? timeZone : "UTC";
    return {
      pollType: "timeSlot",
      options: pollOptions.map((option) => {
        const endTime = new Date(
          option.startTime.getTime() + option.duration * 60_000,
        );
        const parts = formatDateParts(option.startTime, {
          locale,
          timeZone: displayTimeZone,
        });

        return {
          optionId: option.id,
          type: "timeSlot",
          startTime: formatDateTime(option.startTime, {
            preset: "time",
            locale,
            timeFormat,
            timeZone: displayTimeZone,
          }),
          endTime: formatDateTime(endTime, {
            preset: "time",
            locale,
            timeFormat,
            timeZone: displayTimeZone,
          }),
          duration: formatDuration(option.duration, locale),
          month: parts.month,
          day: parts.day,
          dow: parts.weekday,
          year: parts.year,
        } satisfies ParsedTimeSlotOption;
      }),
    };
  } else {
    return {
      pollType: "date",
      options: pollOptions.map((option) => {
        // All-day options are floating dates: always read them in UTC so the
        // calendar date is identical for every viewer, regardless of timezone.
        const parts = formatDateParts(option.startTime, {
          locale,
          timeZone: "UTC",
        });

        return {
          optionId: option.id,
          type: "date",
          month: parts.month,
          day: parts.day,
          dow: parts.weekday,
          year: parts.year,
        } satisfies ParsedDateOption;
      }),
    };
  }
}

export const OptionsProvider = (props: React.PropsWithChildren) => {
  const { poll } = usePoll();
  const { locale, timeZone, timeFormat } = useDateTimeConfig();

  const options = React.useMemo(() => {
    return createOptionsContextValue({
      pollOptions: poll.options,
      pollTimeZone: poll.timeZone,
      locale,
      timeZone,
      timeFormat,
    });
  }, [poll.options, poll.timeZone, locale, timeZone, timeFormat]);

  return (
    <OptionsContext.Provider value={options}>
      {props.children}
    </OptionsContext.Provider>
  );
};
