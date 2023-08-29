import { trpc } from "@rallly/backend";
import { Badge } from "@rallly/ui/badge";
import React from "react";

import { Trans } from "@/components/trans";

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

export const Plan = () => {
  const plan = usePlan();

  if (plan === "paid") {
    return (
      <Badge>
        <Trans i18nKey="planPro" defaults="Pro" />
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Trans i18nKey="planFree" defaults="Free" />
    </Badge>
  );
};
