"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { TimeFormat } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { updateLocalizationAction } from "@/features/user/actions";
import { Trans } from "@/i18n/client";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import { dayjs } from "@/lib/dayjs";
import { useLocale } from "@/lib/locale/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

const formSchema = z.object({
  timeFormat: z.enum(["hours12", "hours24"]),
  timeZone: z.string(),
  weekStart: z.number().min(0).max(6),
});

export const DateTimePreferences = ({
  initialValues,
}: {
  initialValues: {
    timeFormat?: TimeFormat;
    timeZone?: string;
    weekStart?: number;
  };
}) => {
  const updateLocalization = useSafeAction(updateLocalizationAction);
  const { locale } = useLocale();
  const localeDefaults = getLocaleDefaults(locale);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeFormat: initialValues.timeFormat ?? localeDefaults.timeFormat,
      weekStart: initialValues.weekStart ?? localeDefaults.weekStart,
      timeZone: initialValues.timeZone ?? getBrowserTimeZone(),
    },
  });

  const { handleSubmit, formState } = form;

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async (data) => {
          const result = await updateLocalization.executeAsync(data);
          if (!result?.serverError && !result?.validationErrors) {
            form.reset(data);
          }
        })}
      >
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="timeZone"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="timeZone" />
                  </FormLabel>
                  <TimeZoneSelect
                    className="w-fit"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="timeFormat"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="timeFormat" />
                  </FormLabel>
                  <FormControl>
                    <TimeFormatPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="weekStart"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="startOfWeek" />
                  </FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => {
                      field.onChange(Number.parseInt(value, 10));
                    }}
                  >
                    <SelectTrigger className="w-fit min-w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayjs.weekdays().map((day, index) => (
                        <SelectItem key={day} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />
        </div>
        <div className="mt-6 flex gap-x-2">
          <Button
            loading={formState.isSubmitting}
            type="submit"
            disabled={!formState.isDirty}
          >
            <Trans i18nKey="save" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
