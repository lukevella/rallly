import { trpc } from "@rallly/backend";

export const usePlan = () => {
  const { data } = trpc.user.subscription.useQuery();

  const isPaid = data?.active === true;

  return isPaid ? "paid" : "free";
};
