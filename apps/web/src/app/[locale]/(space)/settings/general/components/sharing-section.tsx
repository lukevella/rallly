"use client";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@rallly/ui/field";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { updateSpaceContentVisibilityAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { spaceContentVisibilitySchema } from "@/features/space/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function SharingSection({ disabled = false }: { disabled?: boolean }) {
  const { data: space } = useSpace();
  const { t } = useTranslation();

  const updateContentVisibility = useSafeAction(
    updateSpaceContentVisibilityAction,
  );

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [contentVisibility, setOptimisticContentVisibility] =
    React.useOptimistic(space.contentVisibility);

  const handleChange = (value: unknown) => {
    const parsed = spaceContentVisibilitySchema.safeParse(value);

    if (!parsed.success || parsed.data === contentVisibility) {
      return;
    }

    React.startTransition(async () => {
      setOptimisticContentVisibility(parsed.data);
      const result = await updateContentVisibility.executeAsync({
        contentVisibility: parsed.data,
      });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="spaceSharingTitle" defaults="Sharing" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="spaceSharingDescription"
            defaults="How members work in this space"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <RadioGroup
          value={contentVisibility}
          onValueChange={handleChange}
          disabled={disabled || updateContentVisibility.isExecuting}
          className="gap-4"
        >
          <Field orientation="horizontal">
            <RadioGroupItem value="space" id="sharing-together" />
            <FieldContent>
              <FieldLabel htmlFor="sharing-together">
                <Trans i18nKey="spaceSharingTogether" defaults="Together" />
              </FieldLabel>
              <FieldDescription>
                <Trans
                  i18nKey="spaceSharingTogetherDescription"
                  defaults="Members see everything created in this space."
                />
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="owner" id="sharing-independently" />
            <FieldContent>
              <FieldLabel htmlFor="sharing-independently">
                <Trans
                  i18nKey="spaceSharingIndependently"
                  defaults="Independently"
                />
              </FieldLabel>
              <FieldDescription>
                <Trans
                  i18nKey="spaceSharingIndependentlyDescription"
                  defaults="Members see only what they create themselves."
                />
              </FieldDescription>
            </FieldContent>
          </Field>
        </RadioGroup>
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="spaceSharingNote"
            defaults="Admins can always see everything. This applies to polls, events and anything created in this space."
          />
        </p>
      </PageSectionContent>
    </PageSection>
  );
}
