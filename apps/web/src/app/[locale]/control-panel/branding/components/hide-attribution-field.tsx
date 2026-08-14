"use client";

import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { updateBrandingSettingsAction } from "../actions";

export function HideAttributionField({
  defaultValue,
  disabled = false,
}: {
  defaultValue: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const updateBranding = useSafeAction(updateBrandingSettingsAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated settings; reverts automatically if the action fails.
  const [hideAttribution, setOptimisticHideAttribution] =
    React.useOptimistic(defaultValue);

  const handleToggle = (newChecked: boolean) => {
    React.startTransition(async () => {
      setOptimisticHideAttribution(newChecked);
      const result = await updateBranding.executeAsync({
        hideAttribution: newChecked,
      });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return (
    <Switch
      id="hide-attribution"
      checked={hideAttribution}
      onCheckedChange={handleToggle}
      disabled={disabled || updateBranding.isExecuting}
    />
  );
}
