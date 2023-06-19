import { trpc } from "@rallly/backend";
import { useRouter } from "next/router";
import React from "react";

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
