"use client";

import { posthog } from "@rallly/posthog/client";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import {
  PageSection,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { updateSpaceHideAttributionAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function AttributionSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const isFree = useIsFree();

  const updateHideAttribution = useSafeAction(updateSpaceHideAttributionAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [hideAttribution, setOptimisticHideAttribution] = React.useOptimistic(
    space.hideAttribution,
  );

  const handleToggle = (newChecked: boolean) => {
    if (isFree) {
      posthog?.capture("branding_settings:paywall_trigger", {
        setting: "hide_attribution",
      });
      showPayWall();
      return;
    }

    React.startTransition(async () => {
      setOptimisticHideAttribution(newChecked);
      await updateHideAttribution.executeAsync({
        hideAttribution: newChecked,
      });
    });
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader className="flex items-start justify-between gap-4">
        <div>
          <PageSectionTitle id="remove-attribution-section-title">
            <Trans i18nKey="removeAttribution" defaults="Remove Attribution" />
            {space.tier !== "pro" && <ProBadge className="ml-2 align-middle" />}
          </PageSectionTitle>
          <PageSectionDescription id="remove-attribution-section-description">
            <Trans
              i18nKey="removeAttributionDescription"
              defaults='Hide "Powered by Rallly" on invite pages and participant emails'
            />
          </PageSectionDescription>
        </div>
        <Switch
          aria-labelledby="remove-attribution-section-title"
          aria-describedby="remove-attribution-section-description"
          checked={hideAttribution}
          onCheckedChange={handleToggle}
          disabled={disabled || updateHideAttribution.isExecuting}
        />
      </PageSectionHeader>
    </PageSection>
  );
}
