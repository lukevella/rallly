import { useParams } from "next/navigation";
import React from "react";

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
