import { useParams } from "next/navigation";

import { trpc } from "@/trpc/client";

export const usePoll = () => {
  const params = useParams<{ urlId: string }>();
  const pollQuery = trpc.polls.get.useQuery({ urlId: params?.urlId as string });

  if (!pollQuery.data) {
    throw new Error("Expected poll to be prefetched");
  }

  return pollQuery.data;
};
