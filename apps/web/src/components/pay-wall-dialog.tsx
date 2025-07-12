"use client";

import { pricingData } from "@rallly/billing/pricing";
import { Badge } from "@rallly/ui/badge";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { CheckIcon, SparklesIcon } from "lucide-react";
import * as m from "motion/react-m";
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
  const [period, setPeriod] = React.useState("monthly");

  return (
    <Dialog {...dialog.dialogProps} {...forwardedProps}>
      {children}
      <DialogContent className="w-full max-w-[600px] overflow-hidden bg-gray-50 p-4 sm:p-6">
        <SparklesIcon className="-top-4 absolute left-4 size-32 text-gray-500/10" />
        <div className="space-y-6">
          <header>
            <div className="flex justify-center">
              <div className="inline-flex size-14 items-center justify-center">
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
                  <Badge size="lg" variant="secondary">
                    <Trans i18nKey="planPro" />
                  </Badge>
                </m.div>
              </div>
            </div>
            <DialogTitle className="mt-2 mb-1 text-center font-bold text-xl">
              <Trans defaults="Upgrade to Pro" i18nKey="upgradePromptTitle" />
            </DialogTitle>
            <DialogDescription className="mb-4 text-center text-muted-foreground text-sm leading-relaxed">
              <Trans
                i18nKey="upgradeOverlaySubtitle3"
                defaults="Unlock these feature by upgrading to a Pro plan."
              />
            </DialogDescription>
          </header>
          <section>
            <ul className="grid justify-center gap-2 text-center font-medium text-sm sm:grid-cols-2">
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
          </section>
          <section>
            <RadioGroup value={period} onValueChange={setPeriod}>
              <li className="relative flex items-center justify-between rounded-lg border bg-gray-50 p-4 focus-within:bg-gray-100 focus-within:ring-gray-300 hover:bg-gray-100">
                <div className="flex items-center gap-4">
                  <RadioGroupItem id="monthly" value="monthly" />
                  <label className="font-semibold text-base" htmlFor="monthly">
                    <span role="presentation" className="absolute inset-0" />
                    <Trans defaults="1 month" i18nKey="1month" />
                  </label>
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="font-semibold text-xl">${monthlyPrice}</span>
                  <span className="text-muted-foreground text-sm">/ mo</span>
                </p>
              </li>
              <li className="relative flex items-center justify-between rounded-lg border bg-gray-50 p-4 focus-within:bg-gray-100 focus-within:ring-gray-300 hover:bg-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <RadioGroupItem id="yearly" value="yearly" />
                    <div className="flex items-center gap-2">
                      <label
                        className="font-semibold text-base"
                        htmlFor="yearly"
                      >
                        <span
                          role="presentation"
                          className="absolute inset-0"
                        />
                        <Trans defaults="12 months" i18nKey="12months" />
                      </label>
                      <Badge variant="secondary">
                        <Trans
                          defaults="Save {percentage}%"
                          i18nKey="savePercentage"
                          values={{ percentage: annualSavingsPercentage }}
                        />
                      </Badge>
                    </div>
                  </div>
                  <p className="pointer-events-none flex items-baseline gap-1.5 pl-8 text-muted-foreground text-sm">
                    <span>${yearlyPrice}</span>
                    <span className="line-through opacity-50">
                      ${((pricingData.monthly.amount * 12) / 100).toFixed(2)}
                    </span>
                  </p>
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="font-semibold text-xl">
                    ${monthlyPriceAnnualRate}
                  </span>
                  <span className="text-muted-foreground text-sm">/ mo</span>
                </p>
              </li>
            </RadioGroup>
          </section>
          <footer className="space-y-4">
            <div className="grid gap-2">
              <UpgradeButton
                className="w-full"
                large
                annual={period === "yearly"}
              >
                <Trans i18nKey="upgrade" defaults="Upgrade" />
              </UpgradeButton>
            </div>
            <p className="text-center text-muted-foreground text-sm">
              <Trans
                i18nKey="cancelAnytime"
                defaults="Cancel anytime from your <a>billing page</a>."
                components={{
                  a: (
                    <Link
                      onClick={() => dialog.dismiss()}
                      className="text-link"
                      href="/account/billing"
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
