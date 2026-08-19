"use client";

import { pricingData } from "@rallly/billing/pricing";
import { posthog, useFeatureFlagEnabled } from "@rallly/posthog/client";
import { Badge } from "@rallly/ui/badge";
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
  EyeOffIcon,
  LifeBuoyIcon,
  MailCheckIcon,
  PaletteIcon,
  SparklesIcon,
  TimerResetIcon,
  UserPlusIcon,
} from "lucide-react";
import React from "react";
import { PageIcon } from "@/components/page-icons";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import type { SpaceTier } from "@/features/space/schema";
import { spaceTierSchema } from "@/features/space/schema";
import { Trans } from "@/i18n/client";
import { usePayWallStore } from "../client";
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
      <div className="mt-1.5 inline-flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
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
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-popover-border p-4 transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:ring-primary"
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

const PREMIUM_POLL_FAKE_DOOR_FLAG = "premium-poll-fake-door";

type PlanOption = SpaceTier | "premium-poll";

export function PayWallDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedPlan, setSelectedPlan] = React.useState<PlanOption>("pro");
  const [isAnnual, setIsAnnual] = React.useState(true);
  const [isComingSoonVisible, setIsComingSoonVisible] = React.useState(false);
  const trigger = usePayWallStore((state) => state.trigger);
  const isFakeDoorEnabled = useFeatureFlagEnabled(PREMIUM_POLL_FAKE_DOOR_FLAG);
  const showPremiumPoll =
    !!isFakeDoorEnabled &&
    (trigger?.from === "poll-settings" || trigger?.from === "manage-poll");

  React.useEffect(() => {
    if (!isOpen || !showPremiumPoll) {
      return;
    }
    const { trigger: currentTrigger } = usePayWallStore.getState();
    posthog?.capture("paywall:premium_poll_option_view", {
      from: currentTrigger?.from,
      setting: currentTrigger?.setting,
      action: currentTrigger?.action,
      poll_id: currentTrigger?.pollId,
    });
  }, [isOpen, showPremiumPoll]);

  const handleChangePlan = (value: string) => {
    if (value === "premium-poll") {
      posthog?.capture("paywall:premium_poll_option_select", {
        from: trigger?.from,
        setting: trigger?.setting,
        action: trigger?.action,
        poll_id: trigger?.pollId,
      });
      setSelectedPlan("premium-poll");
      return;
    }
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
          setIsAnnual(true);
          setIsComingSoonVisible(false);
        }
      }}
    >
      <DialogContent
        size="4xl"
        className="overflow-hidden p-0 lg:min-h-[500px]"
      >
        <Tabs
          value={selectedPlan}
          onValueChange={handleChangePlan}
          className="grid min-h-0 grid-cols-1 md:grid-cols-2"
        >
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
                <Trans i18nKey="selectPlan" defaults="Select plan:" />
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
                    isAnnual ? (
                      <Trans
                        i18nKey="perSeatMonthBilledYearly"
                        defaults="/seat/mo, billed yearly"
                      />
                    ) : (
                      <Trans i18nKey="perSeatMonth" defaults="/seat/mo" />
                    )
                  }
                />
                {showPremiumPoll && (
                  <PlanRadioGroupItem
                    value="premium-poll"
                    id="premium-poll"
                    title={
                      <span className="flex items-center gap-2">
                        <Trans i18nKey="premiumPoll" defaults="Premium poll" />
                        <Badge size="sm" variant="secondary">
                          <Trans
                            i18nKey="premiumPollBadge"
                            defaults="This poll only"
                          />
                        </Badge>
                      </span>
                    }
                    price={currencyFormatter.format(
                      pricingData.monthly.amount / 100,
                    )}
                    priceLabel={
                      <Trans i18nKey="premiumPollOneTime" defaults="one time" />
                    }
                  />
                )}
              </RadioGroup>
            </div>

            <div className="space-y-4 pt-4">
              {selectedPlan === "pro" && (
                <label
                  htmlFor="annual-switch"
                  className="relative flex select-none items-start justify-between gap-4 overflow-hidden rounded-lg bg-gray-50 p-4 ring ring-button-outline ring-inset hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                >
                  <BadgeDollarSignIcon className="pointer-events-none absolute -top-5 right-16 size-24 opacity-5" />

                  <div className="flex-1">
                    <div className="text-sm">
                      <Trans
                        i18nKey="yearlyBilling"
                        defaults="Yearly billing"
                      />
                    </div>
                    <div className="mt-1 text-muted-foreground text-sm">
                      <Trans
                        defaults="{yearlyPrice} per year, save {savings}."
                        i18nKey="yearlyBillingDescription"
                        values={{
                          yearlyPrice: currencyFormatter.format(
                            pricingData.yearly.amount / 100,
                          ),
                          savings: currencyFormatter.format(
                            (pricingData.monthly.amount * 12 -
                              pricingData.yearly.amount) /
                              100,
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <Switch
                    checked={isAnnual}
                    onCheckedChange={setIsAnnual}
                    id="annual-switch"
                  />
                </label>
              )}
              {selectedPlan === "pro" && (
                <TabsContent value="pro">
                  <UpgradeButton
                    className="w-full"
                    annual={isAnnual}
                    onClick={() => {
                      posthog?.capture("paywall:upgrade_button_click", {
                        from: trigger?.from,
                        setting: trigger?.setting,
                        action: trigger?.action,
                        poll_id: trigger?.pollId,
                        plan: selectedPlan,
                        interval: isAnnual ? "year" : "month",
                      });
                    }}
                  >
                    <Trans
                      i18nKey="continueToCheckout"
                      defaults="Continue to checkout"
                    />
                  </UpgradeButton>
                </TabsContent>
              )}
              {selectedPlan === "premium-poll" &&
                (isComingSoonVisible ? (
                  <div className="space-y-3 rounded-lg bg-gray-50 p-4 ring ring-button-outline ring-inset dark:bg-gray-700/50">
                    <div className="font-medium text-sm">
                      <Trans
                        i18nKey="premiumPollComingSoonTitle"
                        defaults="Premium polls are coming soon"
                      />
                    </div>
                    <div className="text-muted-foreground text-sm">
                      <Trans
                        i18nKey="premiumPollComingSoonDescription"
                        defaults="One-time purchases aren't available yet, but your interest helps us decide what to build next. Pro includes all of this on unlimited polls."
                      />
                    </div>
                    <UpgradeButton
                      className="w-full"
                      annual={isAnnual}
                      onClick={() => {
                        posthog?.capture("paywall:upgrade_button_click", {
                          from: trigger?.from,
                          setting: trigger?.setting,
                          action: trigger?.action,
                          poll_id: trigger?.pollId,
                          plan: "pro",
                          interval: isAnnual ? "year" : "month",
                          premium_poll_fallback: true,
                        });
                      }}
                    >
                      <Trans
                        i18nKey="upgradeToProInstead"
                        defaults="Upgrade to Pro instead"
                      />
                    </UpgradeButton>
                  </div>
                ) : (
                  <Button
                    size="xl"
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      posthog?.capture("paywall:premium_poll_upgrade_click", {
                        from: trigger?.from,
                        setting: trigger?.setting,
                        action: trigger?.action,
                        poll_id: trigger?.pollId,
                        price: pricingData.monthly.amount,
                      });
                      setIsComingSoonVisible(true);
                    }}
                  >
                    <Trans
                      i18nKey="premiumPollUpgradeButton"
                      defaults="Upgrade this poll"
                    />
                  </Button>
                ))}
              {selectedPlan === "hobby" && (
                <Button disabled={true} size="xl" className="w-full">
                  <Trans i18nKey="currentPlan" defaults="Current plan" />
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
                  <Trans i18nKey="keyBenefits" defaults="Key benefits" />
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
                        i18nKey="thirtyDayPollRetention"
                        defaults="30 day poll retention"
                      />
                    }
                    description={
                      <Trans
                        i18nKey="thirtyDayPollRetentionDescription"
                        defaults="Polls are kept for 30 days after their final date"
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
                  <Trans i18nKey="keyBenefits" defaults="Key benefits" />
                </SubHeading>
                <KeyBenefits>
                  <KeyBenefitsItem
                    icon={<PaletteIcon />}
                    title={
                      <Trans
                        i18nKey="customBranding"
                        defaults="Custom branding"
                      />
                    }
                    description={
                      <Trans
                        i18nKey="customBrandingDescription"
                        defaults="Show your logo and brand colors to your participants"
                      />
                    }
                  />
                  <KeyBenefitsItem
                    icon={<EyeOffIcon />}
                    title={
                      <Trans
                        i18nKey="removeAttribution"
                        defaults="Remove attribution"
                      />
                    }
                    description={
                      <Trans
                        i18nKey="removeAttributionBenefitDescription"
                        defaults='Hide "Powered by Rallly" from your participants'
                      />
                    }
                  />
                  <KeyBenefitsItem
                    icon={<CalendarCheckIcon />}
                    title={
                      <Trans
                        i18nKey="featureNameSchedule"
                        defaults="Schedule poll"
                      />
                    }
                    description={
                      <Trans
                        i18nKey="schedulePollDescription"
                        defaults="Select a final date for your event."
                      />
                    }
                  />
                  <KeyBenefitsItem
                    icon={<ClockIcon />}
                    title={
                      <Trans
                        i18nKey="featureNameExtendedPollLifetime"
                        defaults="Extended poll lifetime"
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
            {showPremiumPoll && (
              <TabsContent value="premium-poll" className="space-y-6">
                <DialogHeader>
                  <DialogTitle>
                    <Trans i18nKey="premiumPoll" defaults="Premium poll" />
                  </DialogTitle>
                  <DialogDescription>
                    <Trans
                      i18nKey="premiumPollTabDescription"
                      defaults="Pro features for this poll only"
                    />
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <SubHeading>
                    <Trans i18nKey="keyBenefits" defaults="Key benefits" />
                  </SubHeading>
                  <KeyBenefits>
                    <KeyBenefitsItem
                      icon={<CalendarCheckIcon />}
                      title={
                        <Trans
                          i18nKey="featureNameSchedule"
                          defaults="Schedule poll"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="schedulePollDescription"
                          defaults="Select a final date for your event."
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<EyeOffIcon />}
                      title={
                        <Trans
                          i18nKey="premiumPollPrivacy"
                          defaults="Participant privacy"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="premiumPollPrivacyDescription"
                          defaults="Hide participant names and votes from respondents"
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<MailCheckIcon />}
                      title={
                        <Trans
                          i18nKey="requireParticipantEmailTitle"
                          defaults="Require email"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="requireParticipantEmailDescription"
                          defaults="Participants must provide an email address to respond."
                        />
                      }
                    />
                    <KeyBenefitsItem
                      icon={<ClockIcon />}
                      title={
                        <Trans
                          i18nKey="premiumPollLifetime"
                          defaults="Keep this poll forever"
                        />
                      }
                      description={
                        <Trans
                          i18nKey="premiumPollLifetimeDescription"
                          defaults="This poll is exempt from the 30 day retention limit"
                        />
                      }
                    />
                  </KeyBenefits>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
