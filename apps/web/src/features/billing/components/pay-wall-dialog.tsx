"use client";

import { pricingData } from "@rallly/billing/pricing";
import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { Switch } from "@rallly/ui/switch";
import { Tabs, TabsContent } from "@rallly/ui/tabs";
import {
  BadgePercentIcon,
  CalendarCheckIcon,
  CalendarSearchIcon,
  ClockIcon,
  EyeOffIcon,
  MailPlusIcon,
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
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import type { PayWallTrigger } from "../client";
import { usePayWallPricing, usePayWallStore } from "../client";
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
      <div className="mt-1.5 inline-flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
        {icon}
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

const proBenefitsList = [
  {
    key: "customBranding",
    icon: <PaletteIcon />,
    title: <Trans i18nKey="customBranding" defaults="Custom branding" />,
    description: (
      <Trans
        i18nKey="customBrandingDescription"
        defaults="Show your logo and brand colors to your participants"
      />
    ),
  },
  {
    key: "emailInvites",
    icon: <MailPlusIcon />,
    title: <Trans i18nKey="emailInvites" defaults="Email invites" />,
    description: (
      <Trans
        i18nKey="emailInvitesDescription"
        defaults="Invite people by email and see who has responded"
      />
    ),
  },
  {
    key: "removeAttribution",
    icon: <EyeOffIcon />,
    title: <Trans i18nKey="removeAttribution" defaults="Remove attribution" />,
    description: (
      <Trans
        i18nKey="removeAttributionBenefitDescription"
        defaults='Hide "Powered by Rallly" from your participants'
      />
    ),
  },
  {
    key: "schedulePoll",
    icon: <CalendarCheckIcon />,
    title: <Trans i18nKey="featureNameSchedule" defaults="Schedule poll" />,
    description: (
      <Trans
        i18nKey="schedulePollDescription"
        defaults="Select a final date for your event."
      />
    ),
  },
  {
    key: "extendedPollLifetime",
    icon: <ClockIcon />,
    title: (
      <Trans
        i18nKey="featureNameExtendedPollLifetime"
        defaults="Extended poll lifetime"
      />
    ),
    description: (
      <Trans
        i18nKey="extendedPollLifetimeDescription"
        defaults="Keep polls indefinitely"
      />
    ),
  },
  {
    key: "teamCollaboration",
    icon: <UserPlusIcon />,
    title: <Trans i18nKey="teamCollaboration" defaults="Team collaboration" />,
    description: (
      <Trans
        i18nKey="teamCollaborationDescription"
        defaults="Invite team members with centralized billing"
      />
    ),
  },
];

// The benefit that triggered the pay wall leads the list.
function getProBenefits(from: PayWallTrigger["from"] | undefined) {
  if (from !== "invite-dialog") return proBenefitsList;
  return [
    ...proBenefitsList.filter((benefit) => benefit.key === "emailInvites"),
    ...proBenefitsList.filter((benefit) => benefit.key !== "emailInvites"),
  ];
}

const fallbackPrices = {
  [pricingData.monthly.currency]: {
    monthly: pricingData.monthly.amount,
    yearly: pricingData.yearly.amount,
  },
};

function currencyLabel(currency: string, locale: string) {
  const code = currency.toUpperCase();
  const symbol = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value;
  return symbol && symbol !== code ? `${symbol} ${code}` : code;
}

export function PayWallDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedPlan, setSelectedPlan] = React.useState<SpaceTier>("pro");
  const [isAnnual, setIsAnnual] = React.useState(true);
  const trigger = usePayWallStore((state) => state.trigger);
  const proBenefits = getProBenefits(trigger?.from);
  const pricing = usePayWallPricing();
  const { t } = useTranslation();
  const { locale } = useDateTimeConfig();
  const prices = pricing?.prices ?? fallbackPrices;
  const currencies = Object.keys(prices);
  const defaultCurrency = pricing?.defaultCurrency ?? currencies[0];
  const [selectedCurrency, setSelectedCurrency] =
    React.useState(defaultCurrency);
  const currency = prices[selectedCurrency]
    ? selectedCurrency
    : defaultCurrency;
  const amounts = prices[currency];

  const handleChangePlan = (value: string) => {
    setSelectedPlan(spaceTierSchema.parse(value));
  };

  const currencyFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale, currency],
  );

  const getProPrice = () => {
    if (isAnnual) {
      return currencyFormatter.format(amounts.yearly / 12 / 100);
    }
    return currencyFormatter.format(amounts.monthly / 100);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setSelectedPlan("pro");
          setIsAnnual(true);
          setSelectedCurrency(defaultCurrency);
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PageIcon size="sm" color="primary">
                    <SparklesIcon />
                  </PageIcon>
                  <DialogTitle>
                    <Trans i18nKey="upgradePromptTitle" />
                  </DialogTitle>
                </div>
                {currencies.length > 1 && (
                  <Select
                    value={currency}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedCurrency(value);
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-8"
                      aria-label={t("currency", { defaultValue: "Currency" })}
                    >
                      <SelectValue>
                        {currencyLabel(currency, locale)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((code) => (
                        <SelectItem key={code} value={code}>
                          {currencyLabel(code, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
              </RadioGroup>
            </div>

            <div className="space-y-4 pt-4">
              {selectedPlan === "pro" && (
                <label
                  htmlFor="annual-switch"
                  className="relative flex select-none items-start justify-between gap-4 overflow-hidden rounded-lg bg-gray-50 p-4 ring ring-button-outline ring-inset hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                >
                  <BadgePercentIcon className="pointer-events-none absolute -top-5 right-16 size-24 opacity-5" />

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
                            amounts.yearly / 100,
                          ),
                          savings: currencyFormatter.format(
                            (amounts.monthly * 12 - amounts.yearly) / 100,
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
                    currency={currency}
                    onClick={() => {
                      posthog?.capture("paywall:upgrade_button_click", {
                        from: trigger?.from,
                        setting: trigger?.setting,
                        action: trigger?.action,
                        poll_id: trigger?.pollId,
                        plan: selectedPlan,
                        interval: isAnnual ? "year" : "month",
                        currency,
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
                  {proBenefits.map((benefit) => (
                    <KeyBenefitsItem
                      key={benefit.key}
                      icon={benefit.icon}
                      title={benefit.title}
                      description={benefit.description}
                    />
                  ))}
                </KeyBenefits>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
