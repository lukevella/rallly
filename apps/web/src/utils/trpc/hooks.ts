import { useRouter } from "next/router";

import { trpc } from "@/utils/trpc";

export const usePollByAdmin = () => {
  const router = useRouter();
  const adminUrlId = router.query.urlId as string;
  const pollQuery = trpc.polls.getByAdminUrlId.useQuery({ urlId: adminUrlId });

  if (!pollQuery.data) {
    throw new Error("Poll not found");
  }

  return pollQuery;
};
