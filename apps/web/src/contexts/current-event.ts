import { trpc } from "@rallly/backend";
import React from "react";
import { createStateContext } from "react-use";

export const [usePollId, PollIdProvider] = createStateContext<string>("");

const useCurrentEventId = () => {
  const [pollId] = usePollId();
  return pollId;
};

export const useCurrentPollResponses = () => {
  const pollId = useCurrentEventId();
  return trpc.polls.participants.list.useQuery({ pollId });
};

export const useCurrentEvent = () => {
  const pollId = useCurrentEventId();
  return trpc.polls.get.useQuery({ urlId: pollId });
};

export type OptionScore = {
  yes: string[];
  ifNeedBe: string[];
  no: string[];
};

export const useScoreByOptionId = () => {
  const { data: responses = [] } = useCurrentPollResponses();
  const { data: options = [] } = useCurrentPollOptions();
  return React.useMemo(() => {
    const res = options.reduce<Record<string, OptionScore>>((acc, option) => {
      acc[option.id] = { yes: [], ifNeedBe: [], no: [] };
      return acc;
    }, {});

    const votes = responses.flatMap((response) => response.votes);

    for (const vote of votes) {
      if (!res[vote.optionId]) {
        res[vote.optionId] = { yes: [], ifNeedBe: [], no: [] };
      }

      switch (vote.type) {
        case "yes":
          res[vote.optionId].yes.push(vote.participantId);
          break;
        case "ifNeedBe":
          res[vote.optionId].ifNeedBe.push(vote.participantId);
          break;
        case "no":
          res[vote.optionId].no.push(vote.participantId);
          break;
      }
    }
    return res;
  }, [responses, options]);
};

export const useCurrentPollOptions = () => {
  const pollId = useCurrentEventId();
  return trpc.polls.options.list.useQuery({ pollId });
};

export const useCreatePollLink = () => {
  const pollId = useCurrentEventId();
  const basePath = `/poll/${pollId}`;
  return React.useCallback(
    (path?: string) => (path ? `${basePath}/${path}` : basePath),
    [basePath],
  );
};

export const useScore = (optionId: string) => {
  const { data: participants = [] } = useCurrentPollResponses();
  return participants.reduce(
    (acc, participant) => {
      for (const vote of participant.votes) {
        if (vote.optionId === optionId) {
          acc[vote.type]++;
        }
      }
      return acc;
    },
    {
      yes: 0,
      ifNeedBe: 0,
      no: 0,
    },
  );
};

// export const useDateFormatter = () => {
//   const { dayjs } = useDayjs();
//   const { preferredTimeZone } = useUserPreferences();
//   const { data: event } = useCurrentEvent();

//   return React.useCallback(
//     (date: string | number | Date, format: string) => {
//       let d = dayjs(date).utc();
//       if (event?.timeZone) {
//         d = d.tz(event.timeZone, true).tz(preferredTimeZone);
//       }
//       return d.format(format);
//     },
//     [dayjs, event?.timeZone, preferredTimeZone],
//   );
// };
