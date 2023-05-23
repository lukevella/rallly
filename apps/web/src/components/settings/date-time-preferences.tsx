import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/form";
import { Skeleton } from "@/components/skeleton";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserPreferences } from "@/contexts/user-preferences";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

import { useDayjs } from "../../utils/dayjs";

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
      timeZone: "",
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
                  <TimeZoneSelect
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
                  <Select value={field.value} onValueChange={field.onChange}>
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
                <FormControl>
                  <Select
                    value={field.value.toString()}
                    onValueChange={field.onChange}
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
                </FormControl>
              </FormItem>
            );
          }}
        />
      </form>
      <div className="mt-6 flex">
        <Button type="primary">
          <Trans i18nKey="save" />
        </Button>
      </div>
    </Form>
  );
};

export default DateTimePreferences;
