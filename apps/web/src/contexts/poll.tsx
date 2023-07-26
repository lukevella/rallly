import { trpc } from "@rallly/backend";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/router";
import React from "react";

import { useDayjs } from "@/utils/dayjs";

export const usePoll = () => {
  const router = useRouter();

  const [urlId] = React.useState(router.query.urlId as string);

  const pollQuery = trpc.polls.get.useQuery(
    { urlId },
    {
      staleTime: Infinity,
    },
  );

  if (!pollQuery.data) {
    throw new Error("Expected poll to be prefetched");
  }

  return pollQuery.data;
};

export const useDateFormatter = () => {
  const { timeZone } = usePoll();
  const { timeZone: preferredTimeZone } = useDayjs();

  return (date: Date | Dayjs) => {
    if (timeZone) {
      return dayjs(date).utc().tz(timeZone, true).tz(preferredTimeZone);
    }

    return dayjs(date).utc();
  };
};
