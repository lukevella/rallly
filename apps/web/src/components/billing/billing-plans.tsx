import { CheckIcon } from "@rallly/icons";
import {
  BillingPlan,
  BillingPlanFooter,
  BillingPlanHeader,
  BillingPlanPeriod,
  BillingPlanPerk,
  BillingPlanPerks,
  BillingPlanPrice,
  BillingPlanTitle,
} from "@rallly/ui/billing-plan";
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
        <BillingPlan>
          <BillingPlanHeader>
            <BillingPlanTitle>
              <Trans i18nKey="planFree" defaults="Free" />
            </BillingPlanTitle>
            <BillingPlanPrice>$0</BillingPlanPrice>
            <BillingPlanPeriod>
              <Trans i18nKey="freeForever" defaults="free forever" />
            </BillingPlanPeriod>
          </BillingPlanHeader>
          <BillingPlanPerks>
            <BillingPlanPerk>
              <Trans i18nKey="plan_unlimitedPolls" defaults="Unlimited polls" />
            </BillingPlanPerk>
            <BillingPlanPerk>
              <Trans
                i18nKey="plan_unlimitedParticipants"
                defaults="Unlimited participants"
              />
            </BillingPlanPerk>
          </BillingPlanPerks>
        </BillingPlan>

        <ProPlan annual={isBilledAnnually}>
          {!isPlus ? (
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
    <BillingPlan variant="primary">
      <BillingPlanHeader>
        <BillingPlanTitle className="text-primary">
          <Trans i18nKey="planPro" defaults="Pro" />
        </BillingPlanTitle>
        {annual ? (
          <>
            <BillingPlanPrice discount={`$${(annualPriceUsd / 12).toFixed(2)}`}>
              ${monthlyPriceUsd}
            </BillingPlanPrice>
            <BillingPlanPeriod>
              <Trans
                i18nKey="annualBillingDescription"
                defaults="per month, billed annually"
              />
            </BillingPlanPeriod>
          </>
        ) : (
          <>
            <BillingPlanPrice>${monthlyPriceUsd}</BillingPlanPrice>
            <BillingPlanPeriod>
              <Trans i18nKey="monthlyBillingDescription" defaults="per month" />
            </BillingPlanPeriod>
          </>
        )}
      </BillingPlanHeader>
      <BillingPlanPerks>
        <BillingPlanPerk>
          <Trans i18nKey="plan_unlimitedPolls" defaults="Unlimited polls" />
        </BillingPlanPerk>
        <BillingPlanPerk>
          <Trans
            i18nKey="plan_unlimitedParticipants"
            defaults="Unlimited participants"
          />
        </BillingPlanPerk>
        <Perk>
          <Trans i18nKey="plan_finalizePolls" defaults="Finalize polls" />
        </Perk>
        <BillingPlanPerk>
          <Trans
            i18nKey="plan_extendedPollLife"
            defaults="Extended poll life"
          />
        </BillingPlanPerk>
        <BillingPlanPerk>
          <Trans i18nKey="plan_prioritySupport" defaults="Priority support" />
        </BillingPlanPerk>
      </BillingPlanPerks>
      <BillingPlanFooter>{children}</BillingPlanFooter>
    </BillingPlan>
  );
};
