"use client";

import { posthog } from "@rallly/posthog/client";
import { Field, FieldGroup, FieldLabel } from "@rallly/ui/field";
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
import { updateSpaceHideCreatePollCtaAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function HideCreatePollCtaSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { data: space } = useSpace();
  const isFree = useIsFree();

  const updateHideCreatePollCta = useSafeAction(
    updateSpaceHideCreatePollCtaAction,
  );

  // Holds the toggled value until the post-action router refresh
  // delivers the updated space data, then defers to it.
  const [pendingHideCreatePollCta, setPendingHideCreatePollCta] =
    React.useState<boolean | null>(null);
  const hideCreatePollCta = pendingHideCreatePollCta ?? space.hideCreatePollCta;

  React.useEffect(() => {
    if (
      pendingHideCreatePollCta !== null &&
      space.hideCreatePollCta === pendingHideCreatePollCta
    ) {
      setPendingHideCreatePollCta(null);
    }
  }, [space.hideCreatePollCta, pendingHideCreatePollCta]);

  const handleToggle = async (newChecked: boolean) => {
    if (isFree) {
      posthog?.capture("hide_create_poll_cta_settings:paywall_trigger");
      showPayWall();
      return;
    }

    setPendingHideCreatePollCta(newChecked);

    const result = await updateHideCreatePollCta.executeAsync({
      hideCreatePollCta: newChecked,
    });

    if (result?.serverError || result?.validationErrors) {
      setPendingHideCreatePollCta(null);
    }
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans
            i18nKey="hideCreatePollCtaTitle"
            defaults="Hide create poll prompt"
          />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="hideCreatePollCtaDescription"
            defaults="Hide the prompt inviting participants to create their own poll after they vote"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup>
          <Field orientation="horizontal">
            <Switch
              checked={hideCreatePollCta}
              onCheckedChange={handleToggle}
              disabled={disabled || updateHideCreatePollCta.isExecuting}
            />
            <FieldLabel>
              <Trans
                i18nKey="hideCreatePollCtaLabel"
                defaults="Hide create poll prompt"
              />
              {space.tier !== "pro" && <ProBadge />}
            </FieldLabel>
          </Field>
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
