"use client";

import { pricingData } from "@rallly/billing/pricing";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
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
  CalendarCheckIcon,
  CalendarSearchIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  LifeBuoyIcon,
  SettingsIcon,
  TimerResetIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";
import type { SpaceTier } from "@/features/space/schema";
import { spaceTierSchema } from "@/features/space/schema";

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
      <div className="rounded-lg border bg-gradient-to-b from-white to-gray-50 p-2">
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

function PlanRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </RadioGroup>
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
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-colors has-[[data-state=checked]]:border-primary-600 has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary"
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

interface PayWallDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PayWallDialog({ isOpen, onClose }: PayWallDialogProps) {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="4xl" className="overflow-hidden p-0 lg:h-[500px]">
        <Tabs value={selectedPlan} onValueChange={handleChangePlan} asChild>
          <div className="grid min-h-0 grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col p-6">
              <DialogHeader>
                <DialogTitle>
                  <Trans i18nKey="upgradePromptTitle" />
                </DialogTitle>
              </DialogHeader>
              <div className="mt-6 flex-1 space-y-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="text-sm">
                    <CheckIcon className="mr-2 inline-block size-4" />
                    <Trans
                      i18nKey="cancelAnytime"
                      components={{
                        a: (
                          <Link
                            className="underline"
                            href="/settings/billing"
                          />
                        ),
                      }}
                    />
                  </li>
                  <li className="text-sm">
                    <CheckIcon className="mr-2 inline-block size-4" />
                    <Trans
                      i18nKey="instantAccess"
                      defaults="Instant access to all features"
                    />
                  </li>
                </ul>
                <hr className="border-gray-100" />
                <Label>
                  <Trans i18nKey="selectPlan" defaults="Select Plan:" />
                </Label>
                <PlanRadioGroup
                  value={selectedPlan}
                  onValueChange={handleChangePlan}
                >
                  <PlanRadioGroupItem
                    value="hobby"
                    id="hobby"
                    title={<Trans i18nKey="planHobbyTitle" defaults="Hobby" />}
                    price={<Trans i18nKey="free" defaults="Free" />}
                  />
                  <PlanRadioGroupItem
                    value="pro"
                    id="pro"
                    title={<Trans i18nKey="planProTitle" defaults="Pro" />}
                    price={getProPrice()}
                    priceLabel={
                      <Trans i18nKey="perSeatMonth" defaults="/seat/mo" />
                    }
                  />
                </PlanRadioGroup>
              </div>

              <div className="space-y-4 pt-4">
                {selectedPlan === "pro" && (
                  <div className="flex justify-between gap-4 rounded-lg border border-dashed bg-muted-background p-4">
                    <div className="space-y-2">
                      <Label htmlFor="annual-switch">
                        <Trans
                          defaults="Save ${amount} with yearly billing"
                          i18nKey="annualSavings"
                          values={{
                            amount: (
                              (pricingData.monthly.amount * 12 -
                                pricingData.yearly.amount) /
                              100
                            ).toFixed(0),
                          }}
                        />
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        <Trans
                          defaults="Pay for 8 months, get 12."
                          i18nKey="annualDiscount"
                        />
                      </p>
                    </div>
                    <Switch
                      checked={isAnnual}
                      onCheckedChange={setIsAnnual}
                      id="annual-switch"
                    />
                  </div>
                )}
                <TabsContent value="pro">
                  <UpgradeButton className="w-full" annual={isAnnual}>
                    <Trans i18nKey="upgrade" defaults="Upgrade" />
                  </UpgradeButton>
                </TabsContent>
                <TabsContent value="hobby">
                  <DialogClose asChild>
                    <Button size="md" disabled={true} className="w-full">
                      <Trans i18nKey="currentPlan" defaults="Current Plan" />
                    </Button>
                  </DialogClose>
                </TabsContent>
              </div>
            </div>

            {/* Right Side - Plan Benefits */}
            <div className="hidden overflow-y-auto bg-muted-background px-6 py-6 md:block">
              <TabsContent value="hobby" className="space-y-6">
                <DialogHeader>
                  <DialogTitle>
                    <Trans i18nKey="planHobbyTitle" defaults="Hobby" />
                  </DialogTitle>
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
                  <DialogTitle>
                    <Trans i18nKey="planProTitle" defaults="Pro" />
                  </DialogTitle>
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
                          i18nKey="featureNameFinalize"
                          defaults="Finalize Poll"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="finalizePollDescription"
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
