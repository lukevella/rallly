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
      showPayWall({ from: "custom-branding", setting: "hide_attribution" });
      return;
    }

    setPendingHideAttribution(newChecked);

    const result = await updateHideAttribution.executeAsync({
      hideAttribution: newChecked,
    });

    if (result?.serverError || result?.validationErrors) {
      setPendingHideAttribution(null);
      return;
    }

    toast.success(t("saved", { defaultValue: "Saved" }));
  };

  return (
    <Setting>
      <SettingTitle>
        <Trans i18nKey="removeAttribution" defaults="Remove Attribution" />
        {space.tier !== "pro" && <ProBadge />}
      </SettingTitle>
      <SettingDescription>
        <Trans
          i18nKey="removeAttributionDescription"
          defaults='Hide "Powered by Rallly" on invite pages and participant emails'
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
