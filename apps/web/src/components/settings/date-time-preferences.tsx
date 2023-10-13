import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import { Form, FormField, FormItem, FormLabel } from "@rallly/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import { usePreferences } from "@/contexts/preferences";
import { useDayjs } from "@/utils/dayjs";

const formSchema = z.object({
  timeFormat: z.enum(["hours12", "hours24"]),
  timeZone: z.string(),
  weekStart: z.number().min(0).max(6),
});

type FormData = z.infer<typeof formSchema>;

const DateTimePreferencesForm = () => {
  const { timeFormat, weekStart, timeZone, locale } = useDayjs();
  const { preferences, updatePreferences } = usePreferences();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeFormat: preferences.timeFormat ?? timeFormat,
      weekStart: preferences.weekStart ?? weekStart,
      timeZone: preferences.timeZone ?? timeZone,
    },
  });

  const { handleSubmit, formState } = form;

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async (data) => {
          updatePreferences(data);
          form.reset(data);
        })}
      >
        <div className="space-y-4">
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
                  <TimeFormatPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
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
                      field.onChange(parseInt(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayjs.weekdays().map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
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
            variant="primary"
            disabled={!formState.isDirty}
          >
            <Trans i18nKey="save" />
          </Button>
          {preferences.timeFormat || preferences.weekStart ? (
            <Button
              onClick={async () => {
                updatePreferences({
                  weekStart: null,
                  timeFormat: null,
                });
                form.reset({
                  weekStart: locale.weekStart,
                  timeFormat: locale.timeFormat,
                });
              }}
            >
              <Trans
                defaults="Use locale defaults"
                i18nKey="useLocaleDefaults"
              />
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
};

export const DateTimePreferences = () => {
  return <DateTimePreferencesForm />;
};
