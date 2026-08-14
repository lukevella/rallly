"use client";

import { pricingData } from "@rallly/billing/pricing";
import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { Switch } from "@rallly/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import {
  BadgeDollarSignIcon,
  BarChart2Icon,
  CalendarCheckIcon,
  CopyIcon,
  EyeOffIcon,
  MailIcon,
  PaletteIcon,
  SparklesIcon,
  UserPlusIcon,
  VenetianMaskIcon,
} from "lucide-react";
import React from "react";
import { PageIcon } from "@/components/page-icons";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { BrandingPreview } from "@/features/branding/components/branding-preview";
import { DEFAULT_PRIMARY_COLOR } from "@/features/branding/constants";
import type { SpaceTier } from "@/features/space/schema";
import { spaceTierSchema } from "@/features/space/schema";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";
import type { PayWallTrigger } from "../client";
import { usePayWallStore } from "../client";
import { PLAN_NAMES } from "../constants";
import {
  AttributionPreview,
  DuplicatePreview,
  FinalizePreview,
  HideParticipantsPreview,
  HideScoresPreview,
  MembersPreview,
  RequireEmailPreview,
} from "./pay-wall-feature-previews";

type PayWallFeatureKey =
  | "require_email"
  | "finalize"
  | "hide_participants"
  | "hide_scores"
  | "duplicate"
  | "branding"
  | "attribution"
  | "members";

/**
 * Maps the trigger that opened the paywall to the feature tab that should be
 * selected by default. Generic triggers (sidebar, billing settings) return
 * null and fall back to the default ordering.
 */
function getFeatureForTrigger(
  trigger: PayWallTrigger | null,
): PayWallFeatureKey | null {
  switch (trigger?.from) {
    case "poll-settings":
      switch (trigger.setting) {
        case "requireParticipantEmail":
          return "require_email";
        case "hideParticipants":
          return "hide_participants";
        case "hideScores":
          return "hide_scores";
        default:
          return null;
      }
    case "manage-poll":
      switch (trigger.action) {
        case "schedule":
          return "finalize";
        case "duplicate":
          return "duplicate";
        default:
          return null;
      }
    case "custom-branding":
      return trigger.setting === "hide_attribution"
        ? "attribution"
        : "branding";
    case "space-members":
      return "members";
    default:
      return null;
  }
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
  spaceName,
  spaceImage,
  primaryColor,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  spaceName?: string;
  spaceImage?: string;
  primaryColor?: string;
}) {
  const [selectedPlan, setSelectedPlan] = React.useState<SpaceTier>("pro");
  const [isAnnual, setIsAnnual] = React.useState(false);
  const trigger = usePayWallStore((state) => state.trigger);
  const { user } = useUser();

  // The trigger decides the initial tab; clicking a tab overrides it until
  // the dialog closes.
  const [manualFeature, setManualFeature] =
    React.useState<PayWallFeatureKey | null>(null);
  const activeFeature =
    manualFeature ?? getFeatureForTrigger(trigger) ?? "require_email";

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    posthog?.capture("paywall:feature_tab_view", {
      feature: activeFeature,
      from: trigger?.from,
      setting: trigger?.setting,
      action: trigger?.action,
      poll_id: trigger?.pollId,
    });
  }, [isOpen, activeFeature, trigger]);

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

  // Ordered by paywall trigger volume so generic triggers open on the
  // features most users hit gates on.
  const features: {
    key: PayWallFeatureKey;
    icon: React.ReactNode;
    title: React.ReactNode;
    description: React.ReactNode;
    preview: React.ReactNode;
  }[] = [
    {
      key: "require_email",
      icon: <MailIcon />,
      title: (
        <Trans
          i18nKey="requireParticipantEmailTitle"
          defaults="Require email"
        />
      ),
      description: (
        <Trans
          i18nKey="requireParticipantEmailDescription"
          defaults="Participants must provide an email address to respond."
        />
      ),
      preview: <RequireEmailPreview />,
    },
    {
      key: "finalize",
      icon: <CalendarCheckIcon />,
      title: <Trans i18nKey="featureNameSchedule" defaults="Schedule poll" />,
      description: (
        <Trans
          i18nKey="schedulePollDescription"
          defaults="Select a final date for your event."
        />
      ),
      preview: <FinalizePreview />,
    },
    {
      key: "hide_participants",
      icon: <VenetianMaskIcon />,
      title: (
        <Trans
          i18nKey="hideParticipantsTitle"
          defaults="Hide participant names"
        />
      ),
      description: (
        <Trans
          i18nKey="hideParticipantsDescription"
          defaults="Participants will not be able to see the names of other respondents."
        />
      ),
      preview: <HideParticipantsPreview />,
    },
    {
      key: "hide_scores",
      icon: <BarChart2Icon />,
      title: <Trans i18nKey="hideScoresTitle" defaults="Hide votes" />,
      description: (
        <Trans
          i18nKey="hideScoresDescription"
          defaults="Hide everyone's votes from a participant until they cast their own."
        />
      ),
      preview: <HideScoresPreview />,
    },
    {
      key: "duplicate",
      icon: <CopyIcon />,
      title: (
        <Trans i18nKey="payWallDuplicateTitle" defaults="Duplicate polls" />
      ),
      description: (
        <Trans
          i18nKey="payWallDuplicateDescription"
          defaults="Reuse any poll as a starting point for your next event."
        />
      ),
      preview: <DuplicatePreview />,
    },
    {
      key: "branding",
      icon: <PaletteIcon />,
      title: <Trans i18nKey="customBranding" defaults="Custom branding" />,
      description: (
        <Trans
          i18nKey="customBrandingDescription"
          defaults="Show your logo and brand colors to your participants"
        />
      ),
      preview: (
        <BrandingPreview
          spaceName={spaceName ?? "My Team"}
          spaceImage={spaceImage}
          primaryColor={primaryColor ?? DEFAULT_PRIMARY_COLOR}
          hostName={user?.name ?? "Jessie Smith"}
        />
      ),
    },
    {
      key: "attribution",
      icon: <EyeOffIcon />,
      title: (
        <Trans i18nKey="removeAttribution" defaults="Remove attribution" />
      ),
      description: (
        <Trans
          i18nKey="removeAttributionBenefitDescription"
          defaults='Hide "Powered by Rallly" from your participants'
        />
      ),
      preview: <AttributionPreview />,
    },
    {
      key: "members",
      icon: <UserPlusIcon />,
      title: (
        <Trans i18nKey="teamCollaboration" defaults="Team collaboration" />
      ),
      description: (
        <Trans
          i18nKey="teamCollaborationDescription"
          defaults="Invite team members with centralized billing"
        />
      ),
      preview: <MembersPreview />,
    },
  ];

  const active = features.find((feature) => feature.key === activeFeature);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setSelectedPlan("pro");
          setIsAnnual(false);
          setManualFeature(null);
        }
      }}
    >
      <DialogContent
        size="4xl"
        className="overflow-hidden p-0 lg:min-h-[500px]"
      >
        <div className="grid min-h-0 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col overflow-y-auto p-6">
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

            {active ? (
              <div className="mt-4 space-y-3 md:hidden">
                {active.preview}
                <p className="text-muted-foreground text-sm">
                  {active.description}
                </p>
              </div>
            ) : null}

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
                    <Trans i18nKey="perSeatMonth" defaults="/seat/mo" />
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
                  <BadgeDollarSignIcon className="pointer-events-none absolute -top-5 right-16 size-24 opacity-5" />

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
                <UpgradeButton
                  className="w-full"
                  annual={isAnnual}
                  onClick={() => {
                    posthog?.capture("paywall:upgrade_button_click", {
                      from: trigger?.from,
                      setting: trigger?.setting,
                      action: trigger?.action,
                      poll_id: trigger?.pollId,
                      feature: activeFeature,
                      plan: selectedPlan,
                      interval: isAnnual ? "year" : "month",
                    });
                  }}
                >
                  <Trans i18nKey="upgrade" defaults="Upgrade" />
                </UpgradeButton>
              ) : (
                <Button disabled={true} size="xl" className="w-full">
                  <Trans i18nKey="currentPlan" defaults="Current plan" />
                </Button>
              )}
            </div>
          </div>

          {/* Right side: Pro feature showcase */}
          <div className="hidden flex-col overflow-y-auto bg-gray-100 p-6 md:flex dark:bg-gray-900">
            <Tabs
              value={activeFeature}
              onValueChange={(value) =>
                setManualFeature(value as PayWallFeatureKey)
              }
              className="flex flex-col gap-4"
            >
              <TabsList className="h-auto flex-wrap justify-start gap-1.5 border-0 bg-transparent p-0">
                {features.map((feature) => (
                  <TabsTrigger
                    key={feature.key}
                    value={feature.key}
                    className="h-7 gap-1.5 rounded-full border bg-background px-2.5 text-xs data-active:border-primary data-active:bg-primary/5 data-active:text-primary data-active:ring-0"
                  >
                    <Icon size="sm">{feature.icon}</Icon>
                    {feature.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {features.map((feature) => (
                <TabsContent
                  key={feature.key}
                  value={feature.key}
                  className="flex flex-col gap-4"
                >
                  {feature.preview}
                  <div>
                    <h3 className="font-medium text-sm">{feature.title}</h3>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            <p className="mt-auto pt-4 text-muted-foreground text-xs">
              <Trans
                i18nKey="payWallAlsoIncluded"
                defaults="Pro also includes extended poll lifetime, API access, and priority support."
              />
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
