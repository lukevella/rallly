"use client";

import { pricingData } from "@rallly/billing/pricing";
import { Badge } from "@rallly/ui/badge";
import type { DialogProps } from "@rallly/ui/dialog";
import { Dialog, DialogContent, useDialog } from "@rallly/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { m } from "framer-motion";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";

const annualSavingsPercentage = (
  ((pricingData.monthly.amount * 12 - pricingData.yearly.amount) /
    (pricingData.monthly.amount * 12)) *
  100
).toFixed(0);

const yearlyPrice = (pricingData.yearly.amount / 100).toFixed(2);
const monthlyPrice = (pricingData.monthly.amount / 100).toFixed(2);
const monthlyPriceAnnualRate = (pricingData.yearly.amount / 100 / 12).toFixed(
  2,
);

export function PayWallDialog({ children, ...forwardedProps }: DialogProps) {
  const dialog = useDialog();
  const [period, setPeriod] = React.useState("yearly");

  return (
    <Dialog {...dialog.dialogProps} {...forwardedProps}>
      {children}
      <DialogContent className="w-[600px] p-4 sm:p-6">
        <div className="space-y-6">
          <header>
            <m.div
              transition={{
                delay: 0.2,
                duration: 0.4,
                type: "spring",
                bounce: 0.5,
              }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
              aria-hidden="true"
            >
              <Badge size="lg" variant="primary">
                <Trans i18nKey="planPro" />
              </Badge>
            </m.div>
            <h1 className="mb-2 mt-4 text-center text-xl font-bold">
              <Trans defaults="Upgrade to Pro" i18nKey="upgradePromptTitle" />
            </h1>
            <p className="text-muted-foreground mb-4 text-center text-sm leading-relaxed">
              <Trans
                i18nKey="upgradeOverlaySubtitle3"
                defaults="Unlock these feature by upgrading to a Pro plan."
              />
            </p>
            <ul className="grid grid-cols-2 justify-center gap-2 text-center text-sm font-medium">
              <li>
                <CheckIcon className="mr-2 inline-block size-4 text-green-600" />
                <Trans i18nKey="featureNameFinalize" defaults="Finalize Poll" />
              </li>
              <li>
                <CheckIcon className="mr-2 inline-block size-4 text-green-600" />
                <Trans
                  i18nKey="featureNameDuplicate"
                  defaults="Duplicate Poll"
                />
              </li>
              <li>
                <CheckIcon className="mr-2 inline-block size-4 text-green-600" />
                <Trans
                  i18nKey="featureNameAdvancedSettings"
                  defaults="Advanced Settings"
                />
              </li>
              <li>
                <CheckIcon className="mr-2 inline-block size-4 text-green-600" />
                <Trans
                  i18nKey="featureNameExtendedPollLifetime"
                  defaults="Extended Poll Lifetime"
                />
              </li>
            </ul>
          </header>
          <section>
            <RadioGroup value={period} onValueChange={setPeriod}>
              <li className="focus-within:ring-primary relative flex items-center justify-between rounded-lg border bg-gray-50 p-4 focus-within:ring-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <RadioGroupItem id="yearly" value="yearly" />
                    <label className="text-base font-semibold" htmlFor="yearly">
                      <span role="presentation" className="absolute inset-0" />
                      <Trans defaults="12 months" i18nKey="12months" />
                    </label>
                    <Badge variant="green">
                      <Trans
                        defaults="Save {percentage}%"
                        i18nKey="savePercentage"
                        values={{ percentage: annualSavingsPercentage }}
                      />
                    </Badge>
                  </div>
                  <p className="text-muted-foreground flex items-baseline gap-1.5 pl-8 text-sm">
                    <span>${yearlyPrice}</span>
                    <span className="line-through opacity-50">
                      ${((pricingData.monthly.amount * 12) / 100).toFixed(2)}
                    </span>
                  </p>
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold">
                    ${monthlyPriceAnnualRate}
                  </span>
                  <span className="text-muted-foreground text-sm">/ mo</span>
                </p>
              </li>
              <li className="focus-within:ring-primary relative flex items-center justify-between rounded-lg border bg-gray-50 p-4 focus-within:ring-2">
                <div className="flex items-center gap-4">
                  <RadioGroupItem id="monthly" value="monthly" />
                  <label className="text-base font-semibold" htmlFor="monthly">
                    <span role="presentation" className="absolute inset-0" />
                    <Trans defaults="1 month" i18nKey="1month" />
                  </label>
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold">${monthlyPrice}</span>
                  <span className="text-muted-foreground text-sm">/ mo</span>
                </p>
              </li>
            </RadioGroup>
          </section>
          <footer className="space-y-4">
            <div className="grid gap-2">
              <UpgradeButton large annual={period === "yearly"}>
                <Trans i18nKey="subscribe" defaults="Subscribe" />
              </UpgradeButton>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              <Trans
                i18nKey="cancelAnytime"
                defaults="Cancel anytime from your <a>billing page</a>."
                components={{
                  a: (
                    <Link
                      onClick={() => dialog.dismiss()}
                      className="text-link"
                      href="/settings/billing"
                    />
                  ),
                }}
              />
            </p>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
