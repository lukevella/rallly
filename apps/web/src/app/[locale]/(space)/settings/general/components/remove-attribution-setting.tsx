"use client";

import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import {
  Setting,
  SettingControl,
  SettingDescription,
  SettingTitle,
} from "@/components/setting";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { updateSpaceHideAttributionAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function RemoveAttributionSetting({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const isFree = useIsFree();
  const { t } = useTranslation();

  const updateHideAttribution = useSafeAction(updateSpaceHideAttributionAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [hideAttribution, setOptimisticHideAttribution] = React.useOptimistic(
    space.hideAttribution,
  );

  const handleToggle = (newChecked: boolean) => {
    if (isFree && newChecked) {
      showPayWall({ from: "custom-branding", setting: "hide_attribution" });
      return;
    }

    React.startTransition(async () => {
      setOptimisticHideAttribution(newChecked);
      const result = await updateHideAttribution.executeAsync({
        hideAttribution: newChecked,
      });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return (
    <Setting>
      <SettingTitle>
        <Trans
          i18nKey="removeAttributionSettingTitle"
          defaults="Remove attribution"
        />
        {space.tier !== "pro" && <ProBadge />}
      </SettingTitle>
      <SettingDescription>
        <Trans
          i18nKey="removeAttributionSettingDescription"
          defaults='Hide "Powered by Rallly" on invite pages and participant emails.'
        />
      </SettingDescription>
      <SettingControl>
        <Switch
          checked={hideAttribution}
          onCheckedChange={handleToggle}
          disabled={disabled || updateHideAttribution.isExecuting}
        />
      </SettingControl>
    </Setting>
  );
}
