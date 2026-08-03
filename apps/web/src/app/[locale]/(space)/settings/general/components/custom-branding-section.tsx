"use client";

import type { Color } from "@rallly/ui/color-picker";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { InputGroupButton } from "@rallly/ui/input-group";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import {
  Setting,
  SettingControl,
  SettingDescription,
  SettingHint,
  SettingRow,
  SettingsGroup,
  SettingTitle,
  useSettingLabels,
} from "@/components/setting";
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
  // Stored values may differ in case from what the picker emits
  const isDirty = hexColor.toLowerCase() !== currentColor.toLowerCase();
  const isDefault =
    hexColor.toLowerCase() === DEFAULT_PRIMARY_COLOR.toLowerCase();

  const updateShowBranding = useSafeAction(updateSpaceShowBrandingAction);
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
      showPayWall({ from: "custom-branding" });
      return;
    }

    setPendingShowBranding(newChecked);

    const result = await updateShowBranding.executeAsync({
      showBranding: newChecked,
    });

    if (result?.serverError || result?.validationErrors) {
      setPendingShowBranding(null);
      return;
    }

    toast.success(t("saved", { defaultValue: "Saved" }));
  };

  const persistColor = async (value: string | null) => {
    const result = await updateSpace.executeAsync({ primaryColor: value });

    if (!result?.serverError && !result?.validationErrors) {
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
  };

  const handleSave = () => persistColor(isDefault ? null : hexColor);

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
        <SettingsGroup>
          <SpaceSettingsForm space={space} disabled={disabled} />
          <SettingRow>
            <SettingTitle>
              <Trans
                i18nKey="primaryColorSettingTitle"
                defaults="Primary color"
              />
            </SettingTitle>
            <SettingDescription>
              <Trans
                i18nKey="primaryColorSettingHint"
                defaults="Used for buttons and highlights."
              />
            </SettingDescription>
            <SettingControl>
              <PrimaryColorField
                value={color}
                onChange={setColor}
                disabled={disabled}
                isDefault={isDefault}
                isDirty={isDirty}
                isSaving={updateSpace.isExecuting}
                onSave={handleSave}
                onReset={handleReset}
              />
            </SettingControl>
          </SettingRow>
          <Setting>
            <SettingTitle>
              <Trans
                i18nKey="customBrandingSettingTitle"
                defaults="Custom branding"
              />
              {space.tier !== "pro" && <ProBadge />}
            </SettingTitle>
            <SettingDescription>
              <Trans
                i18nKey="customBrandingSettingHint"
                defaults="Show your brand color and logos to your participants"
              />
            </SettingDescription>
            <SettingControl>
              <Switch
                checked={showBranding}
                onCheckedChange={handleToggle}
                disabled={disabled || updateShowBranding.isExecuting}
              />
            </SettingControl>
            <SettingHint plain>
              <BrandingPreview
                spaceName={space.name}
                spaceImage={space.image}
                primaryColor={hexColor}
                hostName={user.name}
              />
            </SettingHint>
          </Setting>
        </SettingsGroup>
      </PageSectionContent>
    </PageSection>
  );
}

/**
 * Split out so `useSettingLabels()` runs inside the Setting provider. The
 * picker is a composite control, so `SettingControl` cannot label it directly
 * — the row's title and description are forwarded to the hex input instead.
 */
function PrimaryColorField({
  value,
  onChange,
  disabled,
  isDefault,
  isDirty,
  isSaving,
  onSave,
  onReset,
}: {
  value: Color;
  onChange: (color: Color) => void;
  disabled: boolean;
  isDefault: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const labels = useSettingLabels();

  return (
    <ColorPicker
      className="w-44"
      value={value}
      onChange={onChange}
      {...labels}
      actions={
        disabled ? null : (
          <>
            {!isDefault ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      size="icon-xs"
                      onClick={onReset}
                      aria-label={t("resetToDefault", {
                        defaultValue: "Reset to default",
                      })}
                    >
                      <RotateCcwIcon />
                    </InputGroupButton>
                  }
                />
                <TooltipContent>
                  <Trans i18nKey="resetToDefault" defaults="Reset to default" />
                </TooltipContent>
              </Tooltip>
            ) : null}
            {isDirty ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      size="icon-xs"
                      onClick={onSave}
                      loading={isSaving}
                      aria-label={t("save", { defaultValue: "Save" })}
                    >
                      <CheckIcon />
                    </InputGroupButton>
                  }
                />
                <TooltipContent>
                  <Trans i18nKey="save" defaults="Save" />
                </TooltipContent>
              </Tooltip>
            ) : null}
          </>
        )
      }
    />
  );
}
