"use client";

import { FormField, FormItem, FormLabel, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import * as React from "react";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

import type { NewEventData } from "./types";

export interface DeadlinePickerProps {
  timeZone?: string;
}

export const DeadlinePicker: React.FunctionComponent<DeadlinePickerProps> = ({
  timeZone,
}) => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();
  const watchDeadline = form.watch("deadline");
  const watchTimeZone = form.watch("timeZone") || timeZone || getBrowserTimeZone();

  const [dateValue, setDateValue] = React.useState("");
  const [timeValue, setTimeValue] = React.useState("");

  React.useEffect(() => {
    if (watchDeadline) {
      let deadlineDate = dayjs(watchDeadline);
      if (watchTimeZone) {
        deadlineDate = deadlineDate.tz(watchTimeZone);
      } else {
        deadlineDate = deadlineDate.utc();
      }
      setDateValue(deadlineDate.format("YYYY-MM-DD"));
      setTimeValue(deadlineDate.format("HH:mm"));
    } else {
      setDateValue("");
      setTimeValue("");
    }
  }, [watchDeadline, watchTimeZone]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    updateDeadline(newDate, timeValue);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    updateDeadline(dateValue, newTime);
  };

  const updateDeadline = (date: string, time: string) => {
    if (date && time) {
      const dateTimeString = `${date}T${time}`;
      let deadline: dayjs.Dayjs;
      
      if (watchTimeZone) {
        deadline = dayjs.tz(dateTimeString, watchTimeZone);
      } else {
        deadline = dayjs(dateTimeString);
      }

      form.setValue("deadline", deadline.toISOString(), {
        shouldValidate: true,
      });
    } else if (!date && !time) {
      form.setValue("deadline", null, {
        shouldValidate: true,
      });
    }
  };

  const handleClear = () => {
    setDateValue("");
    setTimeValue("");
    form.setValue("deadline", null, {
      shouldValidate: true,
    });
  };

  return (
    <FormField
      control={form.control}
      name="deadline"
      rules={{
        validate: (value) => {
          if (!value) return true;
          const deadlineDate = dayjs(value);
          if (!deadlineDate.isAfter(dayjs())) {
            return t("deadlineMustBeInFuture", {
              defaultValue: "Deadline must be in the future",
            });
          }
          return true;
        },
      }}
      render={({ field }) => (
        <FormItem>
          <div>
            <FormLabel className="inline-block" htmlFor="deadline">
              <Trans i18nKey="deadline" defaults="Deadline" />
            </FormLabel>
            <span className="ml-1 text-muted-foreground text-sm">
              <Trans i18nKey="optionalLabel" defaults="(Optional)" />
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              id="deadline-date"
              value={dateValue}
              onChange={handleDateChange}
              min={dayjs().format("YYYY-MM-DD")}
              className="flex-1"
            />
            <Input
              type="time"
              id="deadline-time"
              value={timeValue}
              onChange={handleTimeChange}
              className="flex-1"
            />
            {watchDeadline && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                <Trans i18nKey="clear" defaults="Clear" />
              </button>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

