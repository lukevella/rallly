import dayjs, { Dayjs } from "dayjs";
import { useParams } from "next/navigation";
import React from "react";

import { useDayjs } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

export const usePoll = () => {
  const params = useParams<{ urlId: string }>();

  const [urlId] = React.useState(params?.urlId as string);

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
