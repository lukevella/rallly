"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { updateBrandingSettingsAction } from "../actions";

export function HideAttributionField({
  defaultValue,
  disabled = false,
}: {
  defaultValue: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const updateBranding = useMutation(
    mutationOptions(updateBrandingSettingsAction),
  );

  // Optimistic value shown until the post-action router refresh delivers
  // the updated settings; reverts automatically if the action fails.
  const [hideAttribution, setOptimisticHideAttribution] =
    React.useOptimistic(defaultValue);

  const handleToggle = (newChecked: boolean) => {
    React.startTransition(async () => {
      setOptimisticHideAttribution(newChecked);
      try {
        await updateBranding.mutateAsync({ hideAttribution: newChecked });
      } catch {
        return;
      }
      toast.success(t("saved", { defaultValue: "Saved" }));
    });
  };

  return (
    <Switch
      id="hide-attribution"
      checked={hideAttribution}
      onCheckedChange={handleToggle}
      disabled={disabled || updateBranding.isPending}
    />
  );
}
