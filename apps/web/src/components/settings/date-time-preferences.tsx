import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@rallly/backend";
import { Checkbox } from "@rallly/ui/checkbox";
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

import { LegacyButton } from "@/components/button";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import {
  useSystemPreferences,
  useUserPreferences,
} from "@/contexts/preferences";

const formSchema = z.object({
  automatic: z.boolean(),
  timeFormat: z.enum(["hours12", "hours24"]),
  timeZone: z.string(),
  weekStart: z.number().min(0).max(6),
});

type FormData = z.infer<typeof formSchema>;

const DateTimePreferencesForm = (props: {
  defaultValues: FormData;
  className?: string;
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: props.defaultValues,
  });

  const { handleSubmit, formState } = form;

  const watchAutomatic = form.watch("automatic");

  const update = trpc.userPreferences.update.useMutation();
  const deleteUserPreferences = trpc.userPreferences.delete.useMutation();

  const systemPreferences = useSystemPreferences();

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async (data) => {
          if (data.automatic) {
            await deleteUserPreferences.mutateAsync();
            form.reset({ automatic: true, ...systemPreferences });
          } else {
            await update.mutateAsync(data);
            form.reset(data);
          }
        })}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="automatic"
            render={({ field }) => (
              <div className="flex items-center gap-x-2">
                <Checkbox
                  id="automatic"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />
                <FormLabel htmlFor="automatic">
                  <Trans i18nKey="automatic" defaults="Use system defaults" />
                </FormLabel>
              </div>
            )}
          />

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
                    disabled={watchAutomatic}
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
                  <Select
                    disabled={watchAutomatic}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours12">
                        <Trans i18nKey="12h" />
                      </SelectItem>
                      <SelectItem value="hours24">
                        <Trans i18nKey="24h" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    disabled={watchAutomatic}
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
        <div className="mt-6 flex">
          <LegacyButton
            loading={formState.isSubmitting}
            htmlType="submit"
            type="primary"
            disabled={!formState.isDirty}
          >
            <Trans i18nKey="save" />
          </LegacyButton>
        </div>
      </form>
    </Form>
  );
};

export const DateTimePreferences = () => {
  const preferences = useUserPreferences();

  if (!preferences) {
    // TODO (Luke Vella) [2023-05-24]: build skeleton
    return null;
  }

  return <DateTimePreferencesForm defaultValues={preferences} />;
};
