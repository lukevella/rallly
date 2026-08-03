"use client";

import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { InputGroupButton } from "@rallly/ui/input-group";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
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
  SettingsGroup,
  SettingTitle,
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
    }
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
          <Setting labelable={false}>
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
            <SettingControl labelled={false}>
              <ColorPicker
                className="w-44"
                value={color}
                onChange={setColor}
                actions={
                  disabled ? null : (
                    <>
                      {!isDefault ? (
                        <InputGroupButton
                          size="icon-xs"
                          onClick={handleReset}
                          aria-label={t("resetToDefault", {
                            defaultValue: "Reset to default",
                          })}
                        >
                          <RotateCcwIcon />
                        </InputGroupButton>
                      ) : null}
                      {isDirty ? (
                        <InputGroupButton
                          size="icon-xs"
                          onClick={handleSave}
                          loading={updateSpace.isExecuting}
                          aria-label={t("save", { defaultValue: "Save" })}
                        >
                          <CheckIcon />
                        </InputGroupButton>
                      ) : null}
                    </>
                  )
                }
              />
            </SettingControl>
          </Setting>
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
                i18nKey="customBrandingSettingDescription"
                defaults="Show your logo and colors instead of Rallly's on polls, invites and emails."
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
