import { trpc } from "@rallly/backend";
import { Button } from "@rallly/ui/button";
import { useRouter } from "next/router";
import React from "react";

import { useUser } from "@/components/user-provider";
import { planIdMonthly, planIdYearly } from "@/utils/constants";
import { usePostHog } from "@/utils/posthog";

export const UpgradeButton = ({
  children,
  onUpgrade,
  annual,
}: React.PropsWithChildren<{ annual?: boolean; onUpgrade?: () => void }>) => {
  const posthog = usePostHog();
  const [isPendingSubscription, setPendingSubscription] = React.useState(false);
  const { user } = useUser();
  const router = useRouter();

  trpc.user.getBilling.useQuery(undefined, {
    refetchInterval: isPendingSubscription ? 1000 : 0,
  });

  return (
    <>
      <Button
        className="w-full"
        loading={isPendingSubscription}
        variant="primary"
        onClick={() => {
          posthog?.capture("click upgrade button");
          if (user.isGuest) {
            router.push("/login");
          } else {
            window.Paddle.Checkout.open({
              allowQuantity: false,
              product: annual ? planIdYearly : planIdMonthly,
              email: user.email,
              disableLogout: true,
              passthrough: JSON.stringify({ userId: user.id }),
              successCallback: () => {
                posthog?.capture("upgrade", {
                  period: annual ? "yearly" : "monthly",
                });
                onUpgrade?.();
                // fetch user till we get the new plan
                setPendingSubscription(true);
              },
            });
          }
        }}
      >
        {children}
      </Button>
    </>
  );
};
