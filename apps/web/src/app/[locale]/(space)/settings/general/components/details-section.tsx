"use client";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { updateSpaceAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { IndustrySelect } from "@/features/space/components/industry-select";
import type { Industry } from "@/features/space/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { SpaceSettingsForm } from "./space-settings-form";

export function DetailsSection({ disabled = false }: { disabled?: boolean }) {
  const { data: space } = useSpace();
  const { t } = useTranslation();
  const updateSpace = useSafeAction(updateSpaceAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [industry, setOptimisticIndustry] = React.useOptimistic(space.industry);

  const handleIndustryChange = (value: Industry | null) => {
    React.startTransition(async () => {
      setOptimisticIndustry(value);
      const result = await updateSpace.executeAsync({ industry: value });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="details" defaults="Details" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="spaceDetailsCardDescription"
            defaults="What this space is called and what it does"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup variant="divided">
          <SpaceSettingsForm space={space} disabled={disabled} />
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="space-industry">
                <Trans i18nKey="industry" defaults="Industry" />
                <span className="ml-1 font-normal text-muted-foreground">
                  <Trans i18nKey="optional" defaults="(optional)" />
                </span>
              </FieldLabel>
              <FieldDescription>
                <Trans
                  i18nKey="spaceIndustrySettingHint"
                  defaults="The sector your space works in."
                />
              </FieldDescription>
            </FieldContent>
            <IndustrySelect
              id="space-industry"
              value={industry}
              onValueChange={handleIndustryChange}
              disabled={disabled || updateSpace.isExecuting}
            />
          </Field>
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
