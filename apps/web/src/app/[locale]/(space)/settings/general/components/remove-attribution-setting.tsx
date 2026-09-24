"use client";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@rallly/ui/field";
import { Switch } from "@rallly/ui/switch";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { useHideAttributionToggle, useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";

export function RemoveAttributionSetting({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const { hideAttribution, isPending, toggle } = useHideAttributionToggle({
    hideAttribution: space.hideAttribution,
    payWallTrigger: { from: "custom-branding", setting: "hide_attribution" },
  });

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="hide-attribution">
          <Trans
            i18nKey="removeAttributionSettingTitle"
            defaults="Remove attribution"
          />
          {space.tier !== "pro" && <ProBadge />}
        </FieldLabel>
        <FieldDescription>
          <Trans
            i18nKey="removeAttributionSettingDescription"
            defaults='Hide "Powered by Rallly" on invite pages and participant emails.'
          />
        </FieldDescription>
      </FieldContent>
      <Switch
        id="hide-attribution"
        checked={hideAttribution}
        onCheckedChange={toggle}
        disabled={disabled || isPending}
      />
    </Field>
  );
}
