import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@rallly/backend";
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
import { useDayjs } from "@/utils/dayjs";

const formSchema = z.object({
  timeFormat: z.enum(["hours12", "hours24"]),
  timeZone: z.string(),
  weekStart: z.number().min(0).max(6),
});

type FormData = z.infer<typeof formSchema>;

const DateTimePreferencesForm = () => {
  const { data: userPreferences } = trpc.userPreferences.get.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const { handleSubmit, formState } = form;

  const queryClient = trpc.useContext();
  const update = trpc.userPreferences.update.useMutation({
    onSuccess: () => {
      queryClient.userPreferences.get.invalidate();
    },
  });
  const deleteUserPreferences = trpc.userPreferences.delete.useMutation({
    onSuccess: () => {
      queryClient.userPreferences.get.invalidate();
    },
  });

  const {
    timeFormat: localeTimeFormat,
    weekStart: localeWeekStart,
    timeZone,
    locale,
  } = useDayjs();

  if (userPreferences === undefined) {
    return null;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async (data) => {
          await update.mutateAsync(data);
          form.reset(data);
        })}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="timeZone"
            defaultValue={userPreferences?.timeZone ?? timeZone}
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
            defaultValue={userPreferences?.timeFormat ?? localeTimeFormat}
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
            defaultValue={userPreferences?.weekStart ?? localeWeekStart}
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
          {userPreferences !== null ? (
            <Button
              loading={deleteUserPreferences.isLoading}
              onClick={async () => {
                await deleteUserPreferences.mutateAsync();
                form.reset(locale);
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
