import clsx from "clsx";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { useDayjs } from "../../utils/dayjs";
import { useUserPreferences } from "@/contexts/user-preferences";
import { Skeleton } from "@/components/skeleton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/form";
import { Trans } from "@/components/trans";
import TimeZonePicker from "@/components/time-zone-picker";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

const formSchema = z.object({
  timeFormat: z.enum(["hours12", "hours24"]),
  timeZone: z.string(),
  weekStart: z.number().min(0).max(6),
});

const DateTimePreferences = (props: { className?: string }) => {
  const { t } = useTranslation();
  const preferences = useUserPreferences();
  const router = useRouter();

  const { timeFormat, weekStartsOn } = useDayjs();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeFormat: timeFormat === "12h" ? "hours12" : "hours24",
      timeZone: getBrowserTimeZone(),
      weekStart: weekStartsOn === "monday" ? 1 : 0,
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="timeZone"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="timeZone" />
                </FormLabel>
                <FormControl>
                  <TimeZonePicker
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
          name="timeFormat"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="timeFormat" />
                </FormLabel>
                <FormControl>
                  <div>time format picker</div>
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
                  <Trans i18nKey="timeZone" />
                </FormLabel>
                <FormControl>
                  <div>Week start picker</div>
                </FormControl>
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
};

export default DateTimePreferences;
