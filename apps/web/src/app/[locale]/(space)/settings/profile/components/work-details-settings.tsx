"use client";

import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { useForm } from "react-hook-form";
import { updateSpaceAction } from "@/features/space/actions";
import { IndustrySelect } from "@/features/space/components/industry-select";
import type { Industry } from "@/features/space/constants";
import { updateJobTitleAction } from "@/features/user/actions";
import { JobTitleSelect } from "@/features/user/components/job-title-select";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

/**
 * Role and industry. Two different owners — the role is a property of the
 * person, the industry of the organization — but one prompt sends people
 * here, so both render together. The industry writes to the active space,
 * which the label names explicitly: for anyone in more than one space the
 * target would otherwise be invisible.
 */
export function WorkDetailsSettings({
  jobTitle,
  industry,
  suggestedIndustry,
  spaceName,
  canEditIndustry,
}: {
  jobTitle?: string;
  industry?: Industry;
  /**
   * Server-side guess, used only when the space has no stored industry. An
   * unconfirmed inference is exactly the data point that can't be trusted, so
   * it is offered for confirmation rather than saved on the user's behalf.
   */
  suggestedIndustry?: Industry;
  spaceName: string;
  canEditIndustry: boolean;
}) {
  const updateJobTitle = useSafeAction(updateJobTitleAction);
  const updateSpace = useSafeAction(updateSpaceAction);

  const form = useForm({
    defaultValues: {
      jobTitle: jobTitle ?? null,
      industry: industry ?? suggestedIndustry ?? null,
    },
  });

  const values = form.watch();

  // Not formState.isDirty: the industry field can start on an unsaved
  // suggestion, and confirming that suggestion is a save the user has to be
  // able to make.
  const hasChanges =
    values.jobTitle !== (jobTitle ?? null) ||
    values.industry !== (industry ?? null);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          if (data.jobTitle !== (jobTitle ?? null)) {
            await updateJobTitle.executeAsync({ jobTitle: data.jobTitle });
          }

          if (canEditIndustry && data.industry !== (industry ?? null)) {
            await updateSpace.executeAsync({ industry: data.industry });
          }

          form.reset(data);
        })}
        className="flex flex-col gap-y-4"
      >
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="jobTitle">
                <Trans i18nKey="jobTitle" defaults="Your role" />
              </FormLabel>
              <FormControl>
                <JobTitleSelect
                  id="jobTitle"
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="industry">
                <Trans i18nKey="industry" defaults="Industry" />
              </FormLabel>
              <FormControl>
                <IndustrySelect
                  id="industry"
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={form.formState.isSubmitting || !canEditIndustry}
                />
              </FormControl>
              <FormDescription>
                {canEditIndustry ? (
                  <Trans
                    i18nKey="industryScopeHint"
                    defaults="Applies to {spaceName}, not just your account."
                    values={{ spaceName }}
                  />
                ) : (
                  <Trans
                    i18nKey="industryAdminRequired"
                    defaults="Only an admin of {spaceName} can change this."
                    values={{ spaceName }}
                  />
                )}
              </FormDescription>
            </FormItem>
          )}
        />
        <div className="mt-4 flex">
          <Button
            loading={form.formState.isSubmitting}
            type="submit"
            disabled={!hasChanges}
          >
            <Trans i18nKey="save" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
