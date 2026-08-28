"use client";

import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { toast } from "@rallly/ui/sonner";
import { UserIcon, UsersIcon } from "lucide-react";
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

function SharingOption({
  value,
  icon,
  title,
  description,
}: {
  value: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-card p-4 transition-colors hover:bg-accent has-data-disabled:cursor-not-allowed has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-disabled:opacity-60 has-data-disabled:hover:bg-card"
    >
      <span className="mt-0.5 text-muted-foreground group-has-data-checked:text-primary [&_svg]:size-4">
        {icon}
      </span>
      <span className="flex-1 space-y-1">
        <span className="block font-medium text-sm">{title}</span>
        <span className="block text-muted-foreground text-sm">
          {description}
        </span>
      </span>
      <RadioGroupItem value={value} id={id} />
    </label>
  );
}

export function SharingSection() {
  const { data: space } = useSpace();
  const { t } = useTranslation();
  const isAdmin = space.role === "admin";

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
          disabled={!isAdmin || updateContentVisibility.isExecuting}
          className="gap-3"
        >
          <SharingOption
            value="space"
            icon={<UsersIcon />}
            title={<Trans i18nKey="spaceSharingTogether" defaults="Together" />}
            description={
              <Trans
                i18nKey="spaceSharingTogetherDescription"
                defaults="Members see everything created in this space."
              />
            }
          />
          <SharingOption
            value="owner"
            icon={<UserIcon />}
            title={
              <Trans
                i18nKey="spaceSharingIndependently"
                defaults="Independently"
              />
            }
            description={
              <Trans
                i18nKey="spaceSharingIndependentlyDescription"
                defaults="Members see only what they create themselves."
              />
            }
          />
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
