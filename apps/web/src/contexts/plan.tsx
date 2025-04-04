"use client";
import { Badge } from "@rallly/ui/badge";
import React from "react";

import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { trpc } from "@/trpc/client";
import { isSelfHosted } from "@/utils/constants";

export const useSubscription = () => {
  const { data } = trpc.user.subscription.useQuery(undefined, {
    enabled: !isSelfHosted,
  });

  if (isSelfHosted) {
    return {
      active: true,
    };
  }

  return data;
};

export const usePlan = () => {
  const data = useSubscription();

  const isPaid = data?.active === true;

  return isPaid ? "paid" : "free";
};

export const IfSubscribed = ({ children }: React.PropsWithChildren) => {
  const plan = usePlan();

  return plan === "paid" ? <>{children}</> : null;
};

export const IfFreeUser = ({ children }: React.PropsWithChildren) => {
  const subscription = useSubscription();

  return subscription?.active === false ? <>{children}</> : null;
};

export const Plan = () => {
  const plan = usePlan();

  if (plan === "paid") {
    return <ProBadge />;
  }

  return (
    <Badge>
      <Trans i18nKey="planFree" defaults="Free" />
    </Badge>
  );
};
