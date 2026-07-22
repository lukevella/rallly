import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { FormField, FormMessage } from "@rallly/ui/form";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CalendarIcon, InfoIcon, TableIcon } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans, useTranslation } from "@/i18n/client";

import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import type { NewEventData } from "../types";
import MonthCalendar from "./month-calendar/month-calendar";
import WeekCalendar from "./week-calendar";

const PollOptionsForm = ({
  children,
  disableTimeZoneChange,
}: React.PropsWithChildren<{ disableTimeZoneChange?: boolean }>) => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  const { watch, setValue, formState } = form;

  const views = React.useMemo(() => {
    const res = [
      {
        label: t("monthView"),
        value: "month",
        Component: MonthCalendar,
      },
      {
        label: t("weekView"),
        value: "week",
        Component: WeekCalendar,
      },
    ];
    return res;
  }, [t]);

  const watchView = watch("view");

  const selectedView = React.useMemo(
    () => views.find((view) => view.value === watchView) ?? views[0],
    [views, watchView],
  );

  const watchOptions = watch("options", []);
  const watchDuration = watch("duration");
  const watchTimeZone = watch("timeZone");

  const dateOrTimeRangeDialog = useDialog();

  React.useEffect(() => {
    if (watchOptions.length > 1) {
      const optionType = watchOptions[0].type;
      // all options needs to be the same type
      if (watchOptions.some((option) => option.type !== optionType)) {
        dateOrTimeRangeDialog.trigger();
      }
    }
  }, [watchOptions, dateOrTimeRangeDialog]);

  // Keep the derived allDay flag in sync: a poll is all-day when every option
  // is a whole-day date rather than a time slot. Consumed at submit to decide
  // whether a time zone is attached.
  const allDay =
    watchOptions.length > 0 &&
    watchOptions.every((option) => option.type === "date");

  React.useEffect(() => {
    setValue("allDay", allDay);
  }, [allDay, setValue]);

  const watchNavigationDate = watch("navigationDate");
  const navigationDate = new Date(watchNavigationDate ?? Date.now());

  return (
    <Card>
      <CardHeader className="border-card-border border-b">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle>
              <Trans i18nKey="calendar">Calendar</Trans>
            </CardTitle>
            <CardDescription>
              <Trans i18nKey="selectPotentialDates">
                Select potential dates for your event
              </Trans>
            </CardDescription>
          </div>
          <div>
            <FormField
              control={form.control}
              name="view"
              render={({ field }) => (
                <Tabs value={field.value} onValueChange={field.onChange}>
                  <TabsList className="w-full">
                    <TabsTrigger className="grow" value="month">
                      <CalendarIcon className="mr-2 size-4" />
                      <Trans i18nKey="monthView" />
                    </TabsTrigger>
                    <TabsTrigger className="grow" value="week">
                      <TableIcon className="mr-2 size-4" />
                      <Trans i18nKey="weekView" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </div>
        </div>
      </CardHeader>
      <Dialog {...dateOrTimeRangeDialog.dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="mixedOptionsTitle" />
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            <Trans i18nKey="mixedOptionsDescription" />
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setValue(
                  "options",
                  watchOptions.filter((option) => option.type === "date"),
                );
                setValue("timeZone", "");
                dateOrTimeRangeDialog.dismiss();
              }}
            >
              <Trans i18nKey="mixedOptionsKeepDates" />
            </Button>
            <Button
              onClick={() => {
                setValue(
                  "options",
                  watchOptions.filter((option) => option.type === "timeSlot"),
                );
                if (!watchTimeZone) {
                  setValue("timeZone", getBrowserTimeZone());
                }
                dateOrTimeRangeDialog.dismiss();
              }}
              variant="primary"
            >
              <Trans i18nKey="mixedOptionsKeepTimes" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <FormField
          control={form.control}
          name="options"
          rules={{
            validate: (options) => {
              return options.length > 0
                ? true
                : t("calendarHelp", {
                    defaultValue:
                      "You can't create a poll without any options. Add at least one option to continue.",
                  });
            },
          }}
          render={({ field }) => (
            <div>
              <selectedView.Component
                options={field.value}
                date={navigationDate}
                onNavigate={(date) => {
                  setValue("navigationDate", date.toISOString());
                }}
                onChange={(options) => {
                  field.onChange(options);
                }}
                duration={watchDuration}
                onChangeDuration={(duration) => {
                  setValue("duration", duration);
                }}
              />
              {formState.errors.options ? (
                <div className="border-t p-3 text-center text-destructive">
                  <FormMessage />
                </div>
              ) : null}
            </div>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="lockTimeZone"
        render={({ field }) => {
          // Locking is inert for all-day polls (no time to convert) and after
          // votes are cast. Always render the row so the layout is stable.
          const switchDisabled = disableTimeZoneChange || allDay;
          // The zone selector matters only when times DO convert: not locked and
          // not all-day.
          const showTimeZoneSelect = !field.value && !allDay;
          return (
            <div
              className={cn(
                "grid items-center justify-between gap-2.5 border-t p-3 md:flex",
              )}
            >
              <div className="flex h-9 items-center gap-x-2.5 p-2">
                <Switch
                  id="lockTimeZone"
                  disabled={switchDisabled}
                  checked={!!field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    // Unlocking turns conversion back on; seed the organizer's
                    // zone so the selector has a value.
                    if (!checked && !watchTimeZone) {
                      setValue("timeZone", getBrowserTimeZone());
                    }
                  }}
                />
                <Label
                  htmlFor="lockTimeZone"
                  className={
                    switchDisabled ? "text-muted-foreground" : undefined
                  }
                >
                  <Trans i18nKey="lockTimeZone" defaults="Lock timezone" />
                </Label>
                <Tooltip>
                  <TooltipTrigger type="button" delay={0}>
                    <InfoIcon className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="w-72">
                    {disableTimeZoneChange ? (
                      <Trans
                        i18nKey="lockTimeZoneDisabledHelp"
                        defaults="The time zone can't be changed after votes have been cast."
                      />
                    ) : allDay ? (
                      <Trans
                        i18nKey="lockTimeZoneAllDayHelp"
                        defaults="All-day options already show the same date to everyone."
                      />
                    ) : (
                      <Trans
                        i18nKey="lockTimeZoneHelp"
                        defaults="Everyone sees the same time, instead of it converting to each participant's time zone."
                      />
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
              {showTimeZoneSelect ? (
                <TimeZoneSelect
                  disabled={disableTimeZoneChange}
                  value={watchTimeZone || getBrowserTimeZone()}
                  onValueChange={(value) => setValue("timeZone", value)}
                />
              ) : null}
            </div>
          );
        }}
      />
      {children}
    </Card>
  );
};

export default React.memo(PollOptionsForm);
