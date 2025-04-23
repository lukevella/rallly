"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import * as React from "react";
import { useForm } from "react-hook-form";

import { LanguageSelect } from "@/components/poll/language-selector";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import { useTimezone } from "@/features/timezone";
import { useTranslation } from "@/i18n/client";

import { updateUserSetup } from "../actions";
import { type SetupFormValues, setupSchema } from "../schema";

interface SetupFormProps {
  defaultValues?: Partial<SetupFormValues>;
}

export function SetupForm({ defaultValues }: SetupFormProps) {
  const { timezone } = useTimezone();
  const { i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      timeZone: defaultValues?.timeZone || timezone,
      locale: defaultValues?.locale || i18n.language,
    },
  });

  async function onSubmit(data: SetupFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    // Construct FormData for the server action
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("timeZone", data.timeZone);
    formData.append("locale", data.locale);

    const result = await updateUserSetup(formData);

    setIsSubmitting(false);

    if (result?.message) {
      setServerError(result.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {serverError && (
          <p aria-live="polite" className="text-destructive text-sm">
            {serverError}
          </p>
        )}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="name" defaults="Name" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeZone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="timeZone" defaults="Time Zone" />
                </FormLabel>
                <FormControl>
                  <TimeZoneSelect
                    className="w-full"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="language" defaults="Language" />
                </FormLabel>

                <FormControl>
                  <LanguageSelect
                    className="w-full"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      i18n.changeLanguage(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-6">
          <Button
            variant="primary"
            type="submit"
            loading={isSubmitting}
            className="w-full"
          >
            <Trans i18nKey="save" defaults="Save" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
