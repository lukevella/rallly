import { trpc } from "@rallly/backend";
import { useRouter } from "next/router";
import React from "react";

export const usePoll = () => {
  const router = useRouter();

  const [urlId] = React.useState(router.query.urlId as string);
  const [adminToken] = React.useState(router.query.adminToken as string);

  const pollQuery = trpc.polls.get.useQuery(
    { urlId, adminToken },
    {
      staleTime: Infinity,
    },
  );

  return pollQuery.data;
};
