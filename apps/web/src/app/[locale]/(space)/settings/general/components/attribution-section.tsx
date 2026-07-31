"use client";

import { posthog } from "@rallly/posthog/client";
import { Field, FieldLabel } from "@rallly/ui/field";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import {
  PageSection,
  PageSectionContent,
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

  // Holds the toggled value until the post-action router refresh
  // delivers the updated space data, then defers to it.
  const [pendingHideAttribution, setPendingHideAttribution] = React.useState<
    boolean | null
  >(null);
  const hideAttribution = pendingHideAttribution ?? space.hideAttribution;

  React.useEffect(() => {
    if (
      pendingHideAttribution !== null &&
      space.hideAttribution === pendingHideAttribution
    ) {
      setPendingHideAttribution(null);
    }
  }, [space.hideAttribution, pendingHideAttribution]);

  const handleToggle = async (newChecked: boolean) => {
    if (isFree) {
      posthog?.capture("branding_settings:paywall_trigger", {
        setting: "hide_attribution",
      });
      showPayWall();
      return;
    }

    setPendingHideAttribution(newChecked);

    const result = await updateHideAttribution.executeAsync({
      hideAttribution: newChecked,
    });

    if (result?.serverError || result?.validationErrors) {
      setPendingHideAttribution(null);
    }
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="attribution" defaults="Attribution" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="attributionSectionDescription"
            defaults='Control whether "Powered by Rallly" appears on your public pages and emails'
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="hide-attribution-switch">
            <Trans i18nKey="removeAttribution" defaults="Remove Attribution" />
            {space.tier !== "pro" && <ProBadge />}
          </FieldLabel>
          <Switch
            id="hide-attribution-switch"
            checked={hideAttribution}
            onCheckedChange={handleToggle}
            disabled={disabled || updateHideAttribution.isExecuting}
          />
        </Field>
      </PageSectionContent>
    </PageSection>
  );
}
