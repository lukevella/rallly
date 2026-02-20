import { useParams } from "next/navigation";

import { trpc } from "@/trpc/client";

export const usePoll = () => {
  const params = useParams<{ urlId: string }>();
  const [poll] = trpc.polls.get.useSuspenseQuery({
    urlId: params?.urlId as string,
  });

  return poll;
};
