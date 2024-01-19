import {
  BillingPlan,
  BillingPlanDescription,
  BillingPlanHeader,
  BillingPlanPeriod,
  BillingPlanPerk,
  BillingPlanPerks,
  BillingPlanPrice,
  BillingPlanTitle,
} from "@rallly/ui/billing-plan";
import { Button } from "@rallly/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { TrendingUpIcon } from "lucide-react";
import React from "react";

import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";
import { annualPriceUsd, monthlyPriceUsd } from "@/utils/constants";

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
        <div className="grid gap-4 rounded-md md:grid-cols-2">
          <BillingPlan>
            <BillingPlanHeader>
              <BillingPlanTitle>
                <Trans i18nKey="planFree" />
              </BillingPlanTitle>
              <BillingPlanDescription>
                <Trans
                  i18nKey="planFreeDescription"
                  defaults="For casual users"
                />
              </BillingPlanDescription>
            </BillingPlanHeader>
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
            <BillingPlanPerks>
              <BillingPlanPerk>
                <Trans
                  i18nKey="limitedAccess"
                  defaults="Access to core features"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="pollsDeleted"
                  defaults="Polls are automatically deleted once they become inactive"
                />
              </BillingPlanPerk>
            </BillingPlanPerks>
          </BillingPlan>
          <div className="space-y-4 rounded-md border p-4">
            <div>
              <BillingPlanTitle>
                <Trans i18nKey="planPro" />
              </BillingPlanTitle>
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
            <BillingPlanPerks>
              <BillingPlanPerk pro={true}>
                <Trans
                  i18nKey="accessAllFeatures"
                  defaults="Access all features"
                />
              </BillingPlanPerk>
              <BillingPlanPerk pro={true}>
                <Trans i18nKey="plan_extendedPollLife" />
              </BillingPlanPerk>
              <BillingPlanPerk pro={true}>
                <Trans
                  i18nKey="earlyAccess"
                  defaults="Get early access to new features"
                />
              </BillingPlanPerk>
            </BillingPlanPerks>
          </div>
        </div>
      </Tabs>
      <div className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-800">
        <div className="mb-2">
          <TrendingUpIcon className="text-indigo mr-2 mt-0.5 size-6 shrink-0" />
        </div>
        <div className="mb-2 flex items-center gap-x-2">
          <h3 className="text-sm font-semibold">
            <Trans
              i18nKey="upgradeNowSaveLater"
              defaults="Upgrade now, save later"
            />
          </h3>
        </div>
        <p className="text-sm">
          <Trans
            i18nKey="earlyAdopterDescription"
            defaults="As an early adopter, you'll lock in your subscription rate and won't be affected by future price increases."
          />
        </p>
      </div>
    </div>
  );
};
