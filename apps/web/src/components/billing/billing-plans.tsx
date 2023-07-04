import { CheckIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { useRouter } from "next/router";
import React from "react";

import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePlan } from "@/contexts/plan";

const monthlyPriceUsd = 5;
const annualPriceUsd = 30;

const basicPlanIdMonthly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_MONTHLY as string;

const basicPlanIdYearly = process.env.NEXT_PUBLIC_PRO_PLAN_ID_YEARLY as string;

export const BillingPlans = () => {
  const { user } = useUser();
  const router = useRouter();
  const [isPendingSubscription, setPendingSubscription] = React.useState(false);

  const [isBilledAnnually, setBilledAnnually] = React.useState(true);
  const plan = usePlan();
  const isPlus = plan === "paid";

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-4">
          <Trans i18nKey="subscriptionPlans" defaults="Plans" />
        </Label>
        <p className="text-muted-foreground mb-4 text-sm">
          <Trans
            i18nKey="subscriptionDescription"
            defaults="By subscribing, you not only gain access to all features but you are also directly supporting further development of Rallly."
          />
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch
          id="annual-switch"
          checked={isBilledAnnually}
          onCheckedChange={(checked) => {
            setBilledAnnually(checked);
          }}
        />
        <Label htmlFor="annual-switch">
          <Trans
            i18nKey="annualBilling"
            defaults="Annual billing (Save {discount}%)"
            values={{
              discount: Math.round(100 - (annualPriceUsd / 12 / 5) * 100),
            }}
          />
        </Label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col divide-y rounded-md border">
          <div className="p-4">
            <div className="mb-4 flex items-center gap-x-4 text-xl font-bold">
              <Trans i18nKey="planFree" defaults="Free" />
            </div>
            <div>
              <span className="text-3xl font-bold">$0</span>
              <div className="text-muted-foreground text-sm">
                <Trans i18nKey="freeForever" defaults="free forever" />
              </div>
            </div>
          </div>
          <div className="flex grow flex-col p-4">
            <ul className="text-muted-foreground grow space-y-1 text-sm">
              <Perk>
                <Trans
                  i18nKey="plan_unlimitedPolls"
                  defaults="Unlimited polls"
                />
              </Perk>
              <Perk>
                <Trans
                  i18nKey="plan_unlimitedParticipants"
                  defaults="Unlimited participants"
                />
              </Perk>
            </ul>
          </div>
        </div>
        <ProPlan annual={isBilledAnnually}>
          {!isPlus ? (
            <div className="mt-6">
              <Button
                className="w-full"
                loading={isPendingSubscription}
                variant="primary"
                onClick={() => {
                  if (user.isGuest) {
                    router.push("/login");
                  } else {
                    window.Paddle.Checkout.open({
                      allowQuantity: false,
                      product: isBilledAnnually
                        ? basicPlanIdYearly
                        : basicPlanIdMonthly,
                      email: user.email,
                      disableLogout: true,
                      passthrough: JSON.stringify({ userId: user.id }),
                      successCallback: () => {
                        // fetch user till we get the new plan
                        setPendingSubscription(true);
                      },
                    });
                  }
                }}
              >
                <Trans i18nKey="planUpgrade" defaults="Upgrade" />
              </Button>
            </div>
          ) : null}
        </ProPlan>
      </div>
    </div>
  );
};

const Perk = ({ children }: React.PropsWithChildren) => {
  return (
    <li className="flex">
      <CheckIcon className="mr-2 inline h-4 w-4 translate-y-0.5 -translate-x-0.5 text-green-600" />
      <span>{children}</span>
    </li>
  );
};

export const ProPlan = ({
  annual,
  children,
}: React.PropsWithChildren<{
  annual?: boolean;
}>) => {
  return (
    <div className="border-primary ring-primary divide-y overflow-hidden rounded-md border ring-1">
      <div className="bg-pattern p-4">
        <div className="text-primary mb-4 flex items-center gap-x-4 text-xl font-bold">
          <Trans i18nKey="planPro" />
        </div>
        {annual ? (
          <div>
            <span className="mr-2 text-xl font-bold line-through">
              ${monthlyPriceUsd}
            </span>
            <span className="text-3xl font-bold">
              ${(annualPriceUsd / 12).toFixed(2)}
            </span>
            <div className="text-muted-foreground text-sm">
              <Trans
                i18nKey="annualBillingDescription"
                defaults="per month, billed annually"
              />
            </div>
          </div>
        ) : (
          <div>
            <span className="text-3xl font-bold">$5</span>
            <div className="text-muted-foreground text-sm">
              <Trans i18nKey="monthlyBillingDescription" defaults="per month" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <ul className="text-muted-foreground space-y-1 text-sm">
          <Perk>
            <Trans i18nKey="plan_unlimitedPolls" defaults="Unlimited polls" />
          </Perk>
          <Perk>
            <Trans
              i18nKey="plan_unlimitedParticipants"
              defaults="Unlimited participants"
            />
          </Perk>
          <Perk>
            <Trans i18nKey="plan_finalizePolls" defaults="Finalize polls" />
          </Perk>
          <Perk>
            <Trans
              i18nKey="plan_extendedPollLife"
              defaults="Extended poll life"
            />
          </Perk>
          <Perk>
            <Trans i18nKey="plan_prioritySupport" defaults="Priority support" />
          </Perk>
        </ul>
        {children}
      </div>
    </div>
  );
};
