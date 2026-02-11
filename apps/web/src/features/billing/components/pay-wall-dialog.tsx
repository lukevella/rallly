"use client";

import { pricingData } from "@rallly/billing/pricing";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { Switch } from "@rallly/ui/switch";
import { Tabs, TabsContent } from "@rallly/ui/tabs";
import {
  BadgeDollarSignIcon,
  CalendarCheckIcon,
  CalendarSearchIcon,
  ClockIcon,
  CopyIcon,
  LifeBuoyIcon,
  SettingsIcon,
  SparklesIcon,
  TimerResetIcon,
  UserPlusIcon,
} from "lucide-react";
import React from "react";
import { PageIcon } from "@/app/components/page-icons";
import { Trans } from "@/i18n/client";
import { UpgradeButton } from "@/components/upgrade-button";
import type { SpaceTier } from "@/features/space/schema";
import { spaceTierSchema } from "@/features/space/schema";
import { PLAN_NAMES } from "../constants";

function KeyBenefits({ children }: { children?: React.ReactNode }) {
  return <ul className="space-y-3">{children}</ul>;
}

function KeyBenefitsItem({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
        <Icon>{icon}</Icon>
      </div>
      <div>
        <div className="mt-2 font-medium text-sm">{title}</div>
        <div className="mt-1 text-muted-foreground text-xs">{description}</div>
      </div>
    </li>
  );
}

function SubHeading({ children }: { children?: React.ReactNode }) {
  return (
    <h3 className="font-medium text-muted-foreground text-xs uppercase">
      {children}
    </h3>
  );
}

function PlanRadioGroupItem({
  value,
  id,
  title,
  price,
  priceLabel,
}: {
  value: string;
  id: string;
  title: React.ReactNode;
  price: React.ReactNode;
  priceLabel?: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-popover-border p-4 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:ring-primary"
    >
      <RadioGroupItem value={value} id={id} />
      <div className="flex-1">
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="font-medium text-sm">{price}</p>
        {priceLabel && (
          <p className="text-muted-foreground text-xs">{priceLabel}</p>
        )}
      </div>
    </label>
  );
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function PayWallDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedPlan, setSelectedPlan] = React.useState<SpaceTier>("pro");
  const [isAnnual, setIsAnnual] = React.useState(false);

  const handleChangePlan = (value: string) => {
    setSelectedPlan(spaceTierSchema.parse(value));
  };

  const getProPrice = () => {
    if (isAnnual) {
      const yearlyPrice = pricingData.yearly.amount / 100;
      const monthlyEquivalent = yearlyPrice / 12;
      return currencyFormatter.format(monthlyEquivalent);
    } else {
      const monthlyPrice = pricingData.monthly.amount / 100;
      return currencyFormatter.format(monthlyPrice);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setSelectedPlan("pro");
          setIsAnnual(false);
        }
      }}
    >
      <DialogContent
        size="4xl"
        className="overflow-hidden p-0 lg:min-h-[500px]"
      >
        <Tabs value={selectedPlan} onValueChange={handleChangePlan} asChild>
          <div className="grid min-h-0 grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col p-6">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <PageIcon size="sm" color="primary">
                    <SparklesIcon />
                  </PageIcon>
                  <DialogTitle>
                    <Trans i18nKey="upgradePromptTitle" />
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="mt-6 flex flex-1 flex-col gap-4">
                <Label htmlFor="plan">
                  <Trans i18nKey="selectPlan" defaults="Select Plan:" />
                </Label>
                <RadioGroup
                  id="plan"
                  value={selectedPlan}
                  onValueChange={handleChangePlan}
                >
                  <PlanRadioGroupItem
                    value="hobby"
                    id="hobby"
                    title={PLAN_NAMES.HOBBY}
                    price={<Trans i18nKey="planFree" defaults="Free" />}
                  />
                  <PlanRadioGroupItem
                    value="pro"
                    id="pro"
                    title={PLAN_NAMES.PRO}
                    price={getProPrice()}
                    priceLabel={
                      <Trans i18nKey="perSeatMonth" defaults="/seat/mo" />
                    }
                  />
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4">
                {selectedPlan === "pro" && (
                  <label
                    htmlFor="annual-switch"
                    className="flex items-start justify-between gap-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-700"
                  >
                    <div className="mt-1">
                      <BadgeDollarSignIcon className="size-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <Trans
                          defaults="Save {amount} with yearly billing"
                          i18nKey="annualSavings"
                          values={{
                            amount: currencyFormatter.format(
                              (pricingData.monthly.amount * 12 -
                                pricingData.yearly.amount) /
                                100,
                            ),
                          }}
                        />
                      </div>
                      <div className="text-muted-foreground text-sm">
                        <Trans
                          defaults="Pay for {payMonths, number} months, get 12."
                          i18nKey="annualDiscount"
                          values={{
                            payMonths: 8,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-1">
                      <Switch
                        checked={isAnnual}
                        onCheckedChange={setIsAnnual}
                        id="annual-switch"
                      />
                    </div>
                  </label>
                )}
                {selectedPlan === "pro" ? (
                  <TabsContent value="pro">
                    <UpgradeButton className="w-full" annual={isAnnual}>
                      <Trans i18nKey="upgrade" defaults="Upgrade" />
                    </UpgradeButton>
                  </TabsContent>
                ) : (
                  <Button disabled={true} size="lg" className="w-full">
                    <Trans i18nKey="currentPlan" defaults="Current Plan" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side - Plan Benefits */}
            <div className="hidden overflow-y-auto bg-gray-100 px-6 py-6 md:block dark:bg-gray-900">
              <TabsContent value="hobby" className="space-y-6">
                <DialogHeader>
                  <DialogTitle>{PLAN_NAMES.HOBBY}</DialogTitle>
                  <DialogDescription>
                    <Trans
                      i18nKey="planHobbyDescription"
                      defaults="For casual users"
                    />
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <SubHeading>
                    <Trans i18nKey="keyBenefits" defaults="Key Benefits" />
                  </SubHeading>
                  <KeyBenefits>
                    <KeyBenefitsItem
                      icon={<CalendarSearchIcon />}
                      title={
                        <Trans i18nKey="basicPolls" defaults="Basic polls" />
                      }
                      description={
                        <Trans
                          i18nKey="basicPollsDescription"
                          defaults="Create simple scheduling polls"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<TimerResetIcon />}
                      title={
                        <Trans
                          i18nKey="limitedPollLifetime"
                          defaults="Limited Poll Lifetime"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="limitedPollLifetimeDescription"
                          defaults="Inactive polls are automatically deleted"
                        />
                      }
                    />
                  </KeyBenefits>
                </div>
              </TabsContent>
              <TabsContent value="pro" className="space-y-6">
                <DialogHeader>
                  <DialogTitle>{PLAN_NAMES.PRO}</DialogTitle>
                  <DialogDescription>
                    <Trans
                      i18nKey="planProDescription"
                      defaults="For professionals and power users"
                    />
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <SubHeading>
                    <Trans i18nKey="keyBenefits" defaults="Key Benefits" />
                  </SubHeading>
                  <KeyBenefits>
                    <KeyBenefitsItem
                      icon={<CalendarCheckIcon />}
                      title={
                        <Trans
                          i18nKey="featureNameSchedule"
                          defaults="Schedule Poll"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="schedulePollDescription"
                          defaults="Lock in the final meeting time and notify participants"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<CopyIcon />}
                      title={
                        <Trans
                          i18nKey="featureNameDuplicate"
                          defaults="Duplicate Poll"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="duplicatePollDescription"
                          defaults="Quickly create similar polls from existing ones"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<SettingsIcon />}
                      title={
                        <Trans
                          i18nKey="featureNameAdvancedSettings"
                          defaults="Advanced Settings"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="advancedSettingsDescription"
                          defaults="Customize poll behavior and participant permissions"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<ClockIcon />}
                      title={
                        <Trans
                          i18nKey="featureNameExtendedPollLifetime"
                          defaults="Extended Poll Lifetime"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="extendedPollLifetimeDescription"
                          defaults="Keep polls indefinitely"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<UserPlusIcon />}
                      title={
                        <Trans
                          i18nKey="teamCollaboration"
                          defaults="Team collaboration"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="teamCollaborationDescription"
                          defaults="Invite team members with centralized billing"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<LifeBuoyIcon />}
                      title={
                        <Trans
                          i18nKey="prioritySupport"
                          defaults="Priority support"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="prioritySupportDescription"
                          defaults="Get faster response times and dedicated assistance"
                        />
                      }
                    />
                  </KeyBenefits>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
