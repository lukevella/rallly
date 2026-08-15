"use client";

import { parseColor } from "@rallly/ui/color-picker";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import { ColorPickerWithSaveButton } from "@/components/color-picker-with-save-button";
import { IfCloudHosted } from "@/components/environment";
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
  updateSpaceShowBrandingAction,
} from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { BrandingPreview } from "./branding-preview";
import { RemoveAttributionSetting } from "./remove-attribution-setting";
import { SpaceSettingsForm } from "./space-settings-form";

export function CustomBrandingSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const user = useAuthedUser();
  const isFree = useIsFree();
  const { t } = useTranslation();

  const currentColor = space.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const [color, setColor] = React.useState(() => parseColor(currentColor));
  const hexColor = color.toString("hex");
  const isDefault =
    hexColor.toLowerCase() === DEFAULT_PRIMARY_COLOR.toLowerCase();

  const updateShowBranding = useSafeAction(updateSpaceShowBrandingAction);
  const updateSpace = useSafeAction(updateSpaceAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [showBranding, setOptimisticShowBranding] = React.useOptimistic(
    space.showBranding,
  );

  const handleToggle = (newChecked: boolean) => {
    if (isFree) {
      showPayWall({ from: "custom-branding" });
      return;
    }

    React.startTransition(async () => {
      setOptimisticShowBranding(newChecked);
      const result = await updateShowBranding.executeAsync({
        showBranding: newChecked,
      });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  const persistColor = async (value: string | null) => {
    const result = await updateSpace.executeAsync({ primaryColor: value });

    if (!result?.serverError && !result?.validationErrors) {
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
  };

  const handleSave = () => {
    if (isFree) {
      showPayWall({ from: "custom-branding", setting: "primary_color" });
      return;
    }

    return persistColor(isDefault ? null : hexColor);
  };

  // Clearing the column is what "default" means in the database, so reset
  // writes null rather than storing the default value literally.
  const handleReset = async () => {
    setColor(parseColor(DEFAULT_PRIMARY_COLOR));
    await persistColor(null);
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="branding" defaults="Branding" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="brandingCardDescription"
            defaults="How your space appears to you and the people you invite"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup variant="divided">
          <SpaceSettingsForm space={space} disabled={disabled} />
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="primary-color-label">
                <Trans
                  i18nKey="primaryColorSettingTitle"
                  defaults="Primary color"
                />
              </FieldTitle>
              <FieldDescription>
                <Trans
                  i18nKey="primaryColorSettingHint"
                  defaults="Used for buttons and highlights."
                />
              </FieldDescription>
            </FieldContent>
            <ColorPickerWithSaveButton
              value={color}
              onChange={setColor}
              disabled={disabled}
              isSaving={updateSpace.isExecuting}
              onSave={handleSave}
              onReset={handleReset}
              showReset={!isDefault}
              aria-labelledby="primary-color-label"
            />
          </Field>
          <IfCloudHosted>
            <RemoveAttributionSetting disabled={disabled} />
          </IfCloudHosted>
          <Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="show-branding">
                  <Trans
                    i18nKey="customBrandingSettingTitle"
                    defaults="Custom branding"
                  />
                  {space.tier !== "pro" && <ProBadge />}
                </FieldLabel>
                <FieldDescription>
                  <Trans
                    i18nKey="customBrandingSettingLabel"
                    defaults="Show your logo and colors to participants."
                  />
                </FieldDescription>
              </FieldContent>
              <Switch
                id="show-branding"
                checked={showBranding}
                onCheckedChange={handleToggle}
                disabled={disabled || updateShowBranding.isExecuting}
              />
            </Field>
            <BrandingPreview
              spaceName={space.name}
              spaceImage={space.image}
              primaryColor={hexColor}
              hostName={user.name}
            />
          </Field>
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
