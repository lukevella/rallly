"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
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
import { DEFAULT_PRIMARY_COLOR } from "@/features/branding/constants";
import {
  updateSpaceAction,
  updateSpaceHideAttributionAction,
  updateSpaceShowBrandingAction,
} from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function CustomBrandingSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const isFree = useIsFree();
  const { t } = useTranslation();

  const currentColor = space.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const [color, setColor] = React.useState(() => parseColor(currentColor));
  const hexColor = color.toString("hex");
  const isDirty = hexColor !== currentColor;

  const updateShowBranding = useSafeAction(updateSpaceShowBrandingAction);
  const updateHideAttribution = useSafeAction(updateSpaceHideAttributionAction);
  const updateSpace = useSafeAction(updateSpaceAction);

  // Holds the toggled value until the post-action router refresh
  // delivers the updated space data, then defers to it.
  const [pendingShowBranding, setPendingShowBranding] = React.useState<
    boolean | null
  >(null);
  const showBranding = pendingShowBranding ?? space.showBranding;

  React.useEffect(() => {
    if (
      pendingShowBranding !== null &&
      space.showBranding === pendingShowBranding
    ) {
      setPendingShowBranding(null);
    }
  }, [space.showBranding, pendingShowBranding]);

  const handleToggle = async (newChecked: boolean) => {
    if (isFree) {
      posthog?.capture("branding_settings:paywall_trigger", {
        setting: "custom_branding",
      });
      showPayWall();
      return;
    }

    setPendingShowBranding(newChecked);

    const result = await updateShowBranding.executeAsync({
      showBranding: newChecked,
    });

    if (result?.serverError || result?.validationErrors) {
      setPendingShowBranding(null);
    }
  };

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

  const handleToggleHideAttribution = async (newChecked: boolean) => {
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

  const handleSave = async () => {
    const value = hexColor === DEFAULT_PRIMARY_COLOR ? null : hexColor;
    const result = await updateSpace.executeAsync({ primaryColor: value });

    if (!result?.serverError && !result?.validationErrors) {
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="branding" defaults="Branding" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="showBrandingDescription"
            defaults="Show your brand identity on your public pages and emails"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="show-branding-switch">
              <Trans
                i18nKey="useCustomBranding"
                defaults="Enable Custom Branding"
              />
              {space.tier !== "pro" && <ProBadge />}
            </FieldLabel>
            <Switch
              id="show-branding-switch"
              checked={showBranding}
              onCheckedChange={handleToggle}
              disabled={disabled || updateShowBranding.isExecuting}
            />
          </Field>
          <Field
            orientation="horizontal"
            className={
              !showBranding || disabled
                ? "pointer-events-none opacity-50"
                : undefined
            }
          >
            <FieldLabel>
              <Trans i18nKey="primaryColor" defaults="Primary Color" />
            </FieldLabel>
            <div className="flex items-center gap-2">
              <ColorPicker value={color} onChange={setColor} />
              <Button
                onClick={handleSave}
                disabled={!showBranding || !isDirty || disabled}
                loading={updateSpace.isExecuting}
              >
                <Trans i18nKey="save" defaults="Save" />
              </Button>
            </div>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="hide-attribution-switch">
                <Trans
                  i18nKey="removeAttribution"
                  defaults="Remove Attribution"
                />
                {space.tier !== "pro" && <ProBadge />}
              </FieldLabel>
              <FieldDescription>
                <Trans
                  i18nKey="removeAttributionDescription"
                  defaults='Hide "Powered by Rallly" on invite pages and participant emails'
                />
              </FieldDescription>
            </FieldContent>
            <Switch
              id="hide-attribution-switch"
              checked={hideAttribution}
              onCheckedChange={handleToggleHideAttribution}
              disabled={disabled || updateHideAttribution.isExecuting}
            />
          </Field>
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
