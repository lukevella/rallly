import { trpc } from "@rallly/backend";

export const usePlan = () => {
  const { data } = trpc.user.getBilling.useQuery(undefined, {
    staleTime: 10 * 1000,
  });

  const isPaid = Boolean(data && data.endDate.getTime() > Date.now());

  return isPaid ? "paid" : "free";
};
