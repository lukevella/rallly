import { trpc } from "@rallly/backend";
import React from "react";

export const usePlan = () => {
  const { data } = trpc.user.subscription.useQuery();

  const isPaid = data?.active === true;

  return isPaid ? "paid" : "free";
};

export const IfSubscribed = ({ children }: React.PropsWithChildren) => {
  const plan = usePlan();

  return plan === "paid" ? <>{children}</> : null;
};

export const IfFreeUser = ({ children }: React.PropsWithChildren) => {
  const plan = usePlan();

  return plan === "free" ? <>{children}</> : null;
};
