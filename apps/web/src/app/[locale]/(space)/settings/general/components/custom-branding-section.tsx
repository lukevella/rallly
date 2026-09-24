"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Alert, AlertDescription } from "@rallly/ui/alert";
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
import { useMutation } from "@tanstack/react-query";
import { LockIcon } from "lucide-react";
import React from "react";
import { ColorPickerWithSaveButton } from "@/components/color-picker-with-save-button";
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
import { useInstancePolicy } from "@/features/instance-policy/client";
import {
  updateSpaceAction,
  updateSpaceShowBrandingAction,
} from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { BrandingPreview } from "./branding-preview";
import { RemoveAttributionSetting } from "./remove-attribution-setting";

export function CustomBrandingSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const user = useAuthedUser();
  const isFree = useIsFree();
  const { spaceBrandingAllowed, spaceAttributionConfigurable } =
    useInstancePolicy();
  const { t } = useTranslation();

  const currentColor = space.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const [color, setColor] = React.useState(() => parseColor(currentColor));
  const hexColor = color.toString("hex");
  const isDefault =
    hexColor.toLowerCase() === DEFAULT_PRIMARY_COLOR.toLowerCase();

  const updateShowBranding = useMutation(
    mutationOptions(updateSpaceShowBrandingAction),
  );
  const updateSpace = useMutation(mutationOptions(updateSpaceAction));

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
      try {
        await updateShowBranding.mutateAsync({ showBranding: newChecked });
        toast.success(t("saved", { defaultValue: "Saved" }));
      } catch {}
    });
  };

  const persistColor = async (value: string | null) => {
    try {
      await updateSpace.mutateAsync({ primaryColor: value });
      toast.success(t("saved", { defaultValue: "Saved" }));
    } catch {}
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
            defaults="How this space looks to members and participants"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup variant="divided">
          {!spaceBrandingAllowed ? (
            // The divided field group pads its children directly, which would
            // land inside the alert's border — the wrapper takes it instead
            <div>
              <Alert variant="note">
                <LockIcon />
                <AlertDescription>
                  <Trans
                    i18nKey="customBrandingManagedByInstance"
                    defaults="Branding is managed by your instance administrator."
                  />
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
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
                  isSaving={updateSpace.isPending}
                  onSave={handleSave}
                  onReset={handleReset}
                  showReset={!isDefault}
                  aria-labelledby="primary-color-label"
                />
              </Field>
              {spaceAttributionConfigurable ? (
                <RemoveAttributionSetting disabled={disabled} />
              ) : null}
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
                    disabled={disabled || updateShowBranding.isPending}
                  />
                </Field>
                <BrandingPreview
                  spaceName={space.name}
                  spaceImage={space.image}
                  primaryColor={hexColor}
                  hostName={user.name}
                />
              </Field>
            </>
          )}
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
