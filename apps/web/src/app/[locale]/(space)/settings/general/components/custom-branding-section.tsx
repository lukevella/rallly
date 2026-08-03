"use client";

import { Button } from "@rallly/ui/button";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { GlobeIcon } from "lucide-react";
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
            i18nKey="brandingSectionDescription"
            defaults="Your space name, logo and colors, and where they appear"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <div className="mb-4">
          <BrandingPreview
            spaceName={space.name}
            spaceImage={space.image}
            primaryColor={hexColor}
            hostName={user.name}
          />
        </div>
        <SettingsGroup>
          <SpaceSettingsForm space={space} disabled={disabled} />
          <Setting labelable={false}>
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
              <div className="flex items-center gap-x-2">
                <ColorPicker value={color} onChange={setColor} />
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={!isDirty || disabled}
                  loading={updateSpace.isExecuting}
                >
                  <Trans i18nKey="save" defaults="Save" />
                </Button>
              </div>
            </SettingControl>
          </Setting>
          <Setting>
            <SettingIcon>
              <GlobeIcon />
            </SettingIcon>
            <SettingTitle>
              <Trans
                i18nKey="applyCustomBranding"
                defaults="Apply to public pages"
              />
              {space.tier !== "pro" && <ProBadge />}
            </SettingTitle>
            <SettingDescription>
              <Trans
                i18nKey="applyCustomBrandingSettingDescription"
                defaults="Show your logo and colors instead of Rallly's."
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
        </SettingsGroup>
      </PageSectionContent>
    </PageSection>
  );
}
