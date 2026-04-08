"use client";

import { Button } from "@rallly/ui/button";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { Field, FieldGroup, FieldLabel } from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { ProBadge } from "@/components/pro-badge";
import { DEFAULT_PRIMARY_COLOR } from "@/features/branding/constants";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { CustomBrandingSwitch } from "./custom-branding-switch";

export function CustomBrandingSection() {
  const { data: space } = useSpace();
  const { t } = useTranslation();
  const currentColor = space.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const [color, setColor] = React.useState(() => parseColor(currentColor));
  const hexColor = color.toString("hex");
  const isDirty = hexColor !== currentColor;

  const updateSpace = trpc.spaces.update.useMutation();
  const utils = trpc.useUtils();

  const handleSave = async () => {
    const value = hexColor === DEFAULT_PRIMARY_COLOR ? null : hexColor;
    toast.promise(
      updateSpace
        .mutateAsync({ name: space.name, primaryColor: value })
        .then(() => utils.spaces.getCurrent.invalidate()),
      {
        loading: t("savingBranding", { defaultValue: "Saving..." }),
        success: t("brandingSaved", { defaultValue: "Branding saved" }),
        error: t("brandingSaveError", {
          defaultValue: "Failed to save branding",
        }),
      },
    );
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
            <CustomBrandingSwitch checked={space.showBranding} />
            <FieldLabel>
              <Trans
                i18nKey="useCustomBranding"
                defaults="Enable Custom Branding"
              />
              {space.tier !== "pro" && <ProBadge />}
            </FieldLabel>
          </Field>
          <div
            className={
              !space.showBranding ? "pointer-events-none opacity-50" : undefined
            }
          >
            <FieldGroup>
              <Field>
                <FieldLabel>
                  <Trans i18nKey="primaryColor" defaults="Primary Color" />
                </FieldLabel>
                <ColorPicker value={color} onChange={setColor} />
              </Field>
              <Field orientation="horizontal">
                <Button
                  onClick={handleSave}
                  disabled={!isDirty}
                  loading={updateSpace.isPending}
                >
                  <Trans i18nKey="save" defaults="Save" />
                </Button>
              </Field>
            </FieldGroup>
          </div>
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
