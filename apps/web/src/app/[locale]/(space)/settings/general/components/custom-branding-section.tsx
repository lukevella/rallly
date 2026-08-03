"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { PaletteIcon, SparklesIcon } from "lucide-react";
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
  SettingIcon,
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
        <SettingsGroup>
          <Setting>
            <SettingIcon>
              <SparklesIcon />
            </SettingIcon>
            <SettingTitle>
              <Trans
                i18nKey="useCustomBranding"
                defaults="Enable Custom Branding"
              />
              {space.tier !== "pro" && <ProBadge />}
            </SettingTitle>
            <SettingDescription>
              <Trans
                i18nKey="useCustomBrandingSettingDescription"
                defaults="Replace Rallly's colors with your own on public pages and emails."
              />
            </SettingDescription>
            <SettingControl>
              <Switch
                checked={showBranding}
                onCheckedChange={handleToggle}
                disabled={disabled || updateShowBranding.isExecuting}
              />
            </SettingControl>
          </Setting>
          <Setting labelable={false}>
            <SettingIcon>
              <PaletteIcon />
            </SettingIcon>
            <SettingTitle>
              <Trans i18nKey="primaryColor" defaults="Primary Color" />
            </SettingTitle>
            <SettingDescription>
              <Trans
                i18nKey="primaryColorSettingDescription"
                defaults="Used for buttons and highlights on your public pages."
              />
            </SettingDescription>
            <SettingControl labelled={false}>
              <div
                className={cn(
                  "flex items-center gap-x-2",
                  !showBranding || disabled
                    ? "pointer-events-none opacity-50"
                    : undefined,
                )}
              >
                <ColorPicker value={color} onChange={setColor} />
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={!showBranding || !isDirty || disabled}
                  loading={updateSpace.isExecuting}
                >
                  <Trans i18nKey="save" defaults="Save" />
                </Button>
              </div>
            </SettingControl>
          </Setting>
        </SettingsGroup>
      </PageSectionContent>
    </PageSection>
  );
}
