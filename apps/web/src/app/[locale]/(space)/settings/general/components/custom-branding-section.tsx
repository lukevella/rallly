"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { Field, FieldGroup, FieldLabel } from "@rallly/ui/field";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { ProBadge } from "@/components/pro-badge";
import { useBilling } from "@/features/billing/client";
import { DEFAULT_PRIMARY_COLOR } from "@/features/branding/constants";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";
import { useToastProgress } from "@/lib/use-toast-progress";
import { trpc } from "@/trpc/client";

export function CustomBrandingSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const { isFree, showPayWall } = useBilling();
  const toastProgress = useToastProgress();
  const utils = trpc.useUtils();
  const posthog = usePostHog();

  const currentColor = space.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const [color, setColor] = React.useState(() => parseColor(currentColor));
  const hexColor = color.toString("hex");
  const isDirty = hexColor !== currentColor;

  const updateShowBranding = trpc.spaces.updateShowBranding.useMutation({
    onMutate: async ({ showBranding }) => {
      await utils.spaces.getCurrent.cancel();
      const previousData = utils.spaces.getCurrent.getData();
      utils.spaces.getCurrent.setData(undefined, (old) =>
        old ? { ...old, showBranding } : old,
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      utils.spaces.getCurrent.setData(undefined, context?.previousData);
    },
  });

  const updateSpace = trpc.spaces.update.useMutation();

  const handleToggle = (newChecked: boolean) => {
    if (isFree) {
      posthog?.capture("branding_settings:paywall_trigger");
      showPayWall();
      return;
    }
    toastProgress(updateShowBranding.mutateAsync({ showBranding: newChecked }));
  };

  const handleSave = async () => {
    const value = hexColor === DEFAULT_PRIMARY_COLOR ? null : hexColor;
    toastProgress(updateSpace.mutateAsync({ primaryColor: value }));
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
            <Switch
              checked={space.showBranding}
              onCheckedChange={handleToggle}
              disabled={disabled || updateShowBranding.isPending}
            />
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
              !space.showBranding || disabled
                ? "pointer-events-none opacity-50"
                : undefined
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
                  disabled={!space.showBranding || !isDirty || disabled}
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
