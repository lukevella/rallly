import { CheckCircle2Icon, HeartHandshakeIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import React from "react";

import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";

const monthlyPriceUsd = 5;
const annualPriceUsd = 30;

const Perks = ({ children }: React.PropsWithChildren) => {
  return <ul className="grid gap-1">{children}</ul>;
};

const Perk = ({
  children,
  pro,
}: React.PropsWithChildren<{ pro?: boolean }>) => {
  return (
    <li className="flex items-start gap-x-2.5">
      <CheckCircle2Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          !pro ? "text-gray-500" : "text-primary",
        )}
      />
      <div className="text-sm">{children}</div>
    </li>
  );
};

export const BillingPlans = () => {
  const [tab, setTab] = React.useState("yearly");

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">
            <Trans i18nKey="billingPeriodMonthly" />
          </TabsTrigger>
          <TabsTrigger value="yearly">
            <Trans i18nKey="billingPeriodYearly" />
          </TabsTrigger>
        </TabsList>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-md border p-4">
            <div>
              <h3>
                <Trans i18nKey="planFree" />
              </h3>
              <p className="text-muted-foreground text-sm">
                <Trans
                  i18nKey="planFreeDescription"
                  defaults="For casual users"
                />
              </p>
            </div>
            <div>
              <BillingPlanPrice>$0</BillingPlanPrice>
              <BillingPlanPeriod>
                <Trans i18nKey="freeForever" />
              </BillingPlanPeriod>
            </div>
            <hr />
            <Button disabled className="w-full">
              <Trans i18nKey="currentPlan" defaults="Current Plan" />
            </Button>
            <Perks>
              <Perk>
                <Trans
                  i18nKey="limitedAccess"
                  defaults="Limited access to certain features"
                />
              </Perk>
              <Perk>
                <Trans
                  i18nKey="pollsDeleted"
                  defaults="Polls are automatically deleted once they become inactive"
                />
              </Perk>
            </Perks>
          </div>
          <div className="space-y-4 rounded-md border p-4">
            <div>
              <h3>
                <Trans i18nKey="planPro" />
              </h3>
              <p className="text-muted-foreground text-sm">
                <Trans
                  i18nKey="planProDescription"
                  defaults="For power users and professionals"
                />
              </p>
            </div>
            <div className="flex">
              <TabsContent value="yearly">
                <BillingPlanPrice
                  discount={`$${(annualPriceUsd / 12).toFixed(2)}`}
                >
                  ${monthlyPriceUsd}
                </BillingPlanPrice>
                <BillingPlanPeriod>
                  <Trans
                    i18nKey="annualBillingDescription"
                    defaults="per month, billed annually"
                  />
                </BillingPlanPeriod>
              </TabsContent>

              <TabsContent value="monthly">
                <BillingPlanPrice>${monthlyPriceUsd}</BillingPlanPrice>
                <BillingPlanPeriod>
                  <Trans
                    i18nKey="monthlyBillingDescription"
                    defaults="per month"
                  />
                </BillingPlanPeriod>
              </TabsContent>
            </div>
            <hr />
            <UpgradeButton annual={tab === "yearly"} />
            <Perks>
              <Perk pro={true}>
                <Trans
                  i18nKey="accessAllFeatures"
                  defaults="Access all features"
                />
              </Perk>
              <Perk pro={true}>
                <Trans i18nKey="plan_extendedPollLife" />
              </Perk>
              <Perk pro={true}>
                <Trans
                  i18nKey="earlyAccess"
                  defaults="Get early access to new features"
                />
              </Perk>
            </Perks>
          </div>
        </div>
      </Tabs>
      <div className="rounded-md border bg-gray-50 px-4 py-3">
        <div className="flex items-start justify-between">
          <HeartHandshakeIcon className="mb-4 mr-2 mt-0.5 h-6 w-6 shrink-0 text-pink-600" />
        </div>
        <div className="mb-2 flex items-center gap-x-2">
          <h3 className="text-sm">
            <Trans
              i18nKey="limitedLifetimeDeal"
              defaults="Limited Lifetime Deal"
            />
          </h3>
        </div>
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="earlyAdopterDescription"
            defaults="As an early adopter, you'll lock in your subscription rate and won't be affected by future price increases."
          />
        </p>
      </div>
    </div>
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
        <BillingPlanPerk>
          <Trans i18nKey="plan_finalizePolls" defaults="Finalize polls" />
        </BillingPlanPerk>
        <BillingPlanPerk>
          <Trans
            i18nKey="planCustomizablePollSettings"
            defaults="Customizable poll settings"
          />
        </BillingPlanPerk>
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
