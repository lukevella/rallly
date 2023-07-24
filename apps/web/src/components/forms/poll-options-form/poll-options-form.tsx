import { CalendarIcon, TableIcon } from "@rallly/icons";
import { Card, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import { FormField, FormMessage } from "@rallly/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import TimeZonePicker from "@/components/time-zone-picker";

import { getBrowserTimeZone } from "../../../utils/date-time-utils";
import { useModal } from "../../modal";
import { NewEventData } from "../types";
import MonthCalendar from "./month-calendar";
import { DateTimeOption } from "./types";
import WeekCalendar from "./week-calendar";

export type PollOptionsData = {
  navigationDate: string; // used to navigate to the right part of the calendar
  duration: number; // duration of the event in minutes
  timeZone: string;
  view: string;
  options: DateTimeOption[];
};

const PollOptionsForm = ({ children }: React.PropsWithChildren) => {
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const watchOptions = watch("options", [])!;
  const watchDuration = watch("duration");
  const watchTimeZone = watch("timeZone");

  const datesOnly = watchOptions.every((option) => option.type === "date");

  const [dateOrTimeRangeModal, openDateOrTimeRangeModal] = useModal({
    title: t("mixedOptionsTitle"),
    description: t("mixedOptionsDescription"),
    okText: t("mixedOptionsKeepTimes"),
    onOk: () => {
      setValue(
        "options",
        watchOptions.filter((option) => option.type === "timeSlot"),
      );
      if (!watchTimeZone) {
        setValue("timeZone", getBrowserTimeZone());
      }
    },
    cancelText: t("mixedOptionsKeepDates"),
    onCancel: () => {
      setValue(
        "options",
        watchOptions.filter((option) => option.type === "date"),
      );
      setValue("timeZone", "");
    },
  });

  React.useEffect(() => {
    if (watchOptions.length > 1) {
      const optionType = watchOptions[0].type;
      // all options needs to be the same type
      if (watchOptions.some((option) => option.type !== optionType)) {
        openDateOrTimeRangeModal();
      }
    }
  }, [watchOptions, openDateOrTimeRangeModal]);

  const watchNavigationDate = watch("navigationDate");
  const navigationDate = new Date(watchNavigationDate ?? Date.now());

  return (
    <Card>
      <CardHeader>
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
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <Trans i18nKey="monthView" />
                    </TabsTrigger>
                    <TabsTrigger className="grow" value="week">
                      <TableIcon className="mr-2 h-4 w-4" />
                      <Trans i18nKey="weekView" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </div>
        </div>
      </CardHeader>
      {dateOrTimeRangeModal}
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
                  if (
                    length === 0 ||
                    options.every((option) => option.type === "date")
                  ) {
                    // unset the timeZone if we only have date option
                    setValue("timeZone", "");
                  }
                  if (
                    options.length > 0 &&
                    !formState.touchedFields.timeZone &&
                    options.every((option) => option.type === "timeSlot")
                  ) {
                    // set timeZone if we are adding time ranges and we haven't touched the timeZone field
                    setValue("timeZone", getBrowserTimeZone());
                  }
                }}
                duration={watchDuration}
                onChangeDuration={(duration) => {
                  setValue("duration", duration);
                }}
              />
              {formState.errors.options ? (
                <div className="border-t bg-red-50 p-3 text-center">
                  <FormMessage />
                </div>
              ) : null}
            </div>
          )}
        />
      </div>
      <div className="grow border-t bg-gray-50 px-5 py-3">
        <FormField
          control={form.control}
          name="timeZone"
          render={({ field }) => (
            <TimeZonePicker
              value={field.value}
              onBlur={field.onBlur}
              onChange={(timeZone) => {
                setValue("timeZone", timeZone, { shouldTouch: true });
              }}
              disabled={datesOnly}
            />
          )}
        />
      </div>
      {children}
    </Card>
  );
};

export default React.memo(PollOptionsForm);
