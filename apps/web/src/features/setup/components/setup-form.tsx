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
import { useForm } from "react-hook-form";

import { LanguageSelect } from "@/components/poll/language-selector";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import { useTimezone } from "@/features/timezone";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

import { completeSetupAction } from "../actions";
import type { SetupFormValues } from "../schema";
import { setupSchema } from "../schema";

interface SetupFormProps {
  defaultValues?: Partial<SetupFormValues>;
}

export function SetupForm({ defaultValues }: SetupFormProps) {
  const { timezone } = useTimezone();
  const { i18n } = useTranslation();
  const completeSetup = useSafeAction(completeSetupAction);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      timeZone: defaultValues?.timeZone || timezone,
      locale: defaultValues?.locale || i18n.language,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await completeSetup.executeAsync(data);
        })}
      >
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
          {completeSetup.result.serverError && (
            <FormMessage>{completeSetup.result.serverError}</FormMessage>
          )}
        </div>
        <div className="mt-6">
          <Button
            variant="primary"
            type="submit"
            loading={form.formState.isSubmitting}
            className="w-full"
          >
            <Trans i18nKey="save" defaults="Save" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
