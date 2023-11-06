"use client";
import { Badge } from "@rallly/ui/badge";
import React from "react";

import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { isSelfHosted } from "@/utils/constants";
import { trpc } from "@/utils/trpc/client";

export const useSubscription = () => {
  const { user } = useUser();

  const { data } = trpc.user.subscription.useQuery(undefined, {
    enabled: !isSelfHosted && user.isGuest === false,
  });

  if (isSelfHosted) {
    return {
      active: true,
    };
  }

  if (user.isGuest) {
    return {
      active: false,
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
