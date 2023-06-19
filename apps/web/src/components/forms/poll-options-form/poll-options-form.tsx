import { CalendarIcon, TableIcon } from "@rallly/icons";
import { Form, FormItem } from "@rallly/ui/form";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { getBrowserTimeZone } from "../../../utils/date-time-utils";
import { useModal } from "../../modal";
import TimeZonePicker from "../../time-zone-picker";
import { PollFormProps } from "../types";
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

const PollOptionsForm: React.FunctionComponent<
  PollFormProps<PollOptionsData> & { title?: string }
> = ({ name, defaultValues, onSubmit, onChange, title, className }) => {
  const { t } = useTranslation();
  const form = useForm<PollOptionsData>({
    defaultValues: {
      options: [],
      duration: 30,
      timeZone: "",
      navigationDate: new Date().toISOString(),
      ...defaultValues,
    },
    resolver: (values) => {
      return {
        values,
        errors:
          values.options.length === 0
            ? {
                options: true,
              }
            : {},
      };
    },
  });

  const { control, handleSubmit, watch, setValue, formState } = form;

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

  const watchOptions = watch("options");
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
    if (onChange) {
      const subscription = watch(({ options = [], ...rest }) => {
        // Watch returns a deep partial here which is not really accurate and messes up
        // the types a bit. Repackaging it to keep the types sane.
        onChange({ options: options as DateTimeOption[], ...rest });
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [watch, onChange]);

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
  const navigationDate = new Date(watchNavigationDate);

  const [calendarHelpModal, openHelpModal] = useModal({
    overlayClosable: true,
    title: t("calendarHelpTitle"),
    description: t("calendarHelp"),
    okText: t("ok"),
  });

  return (
    <Form {...form}>
      <form
        id={name}
        className={clsx("w-full", className)}
        onSubmit={handleSubmit(onSubmit, openHelpModal)}
      >
        {calendarHelpModal}
        {dateOrTimeRangeModal}
        {/* <div className="mb-8">
            <h2 className="">
              <Trans i18nKey="dates" defaults="Dates" />
            </h2>
            <p className="leading-6 text-gray-500">
              <Trans
                i18nKey="datesDescription"
                defaults="Select a few dates for your participants to choose from"
              />
            </p>
          </div> */}
        <FormItem>
          <div className="mb-3 flex flex-col gap-x-4 gap-y-3 sm:flex-row">
            <div className="grow">
              <Controller
                control={control}
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
            <div className="flex space-x-3">
              <div className="segment-button w-full sm:w-auto">
                <button
                  className={clsx({
                    "segment-button-active": selectedView.value === "month",
                  })}
                  onClick={() => {
                    setValue("view", "month");
                  }}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" /> {t("monthView")}
                </button>
                <button
                  className={clsx({
                    "segment-button-active": selectedView.value === "week",
                  })}
                  type="button"
                  onClick={() => {
                    setValue("view", "week");
                  }}
                >
                  <TableIcon className="mr-2 h-4 w-4" /> {t("weekView")}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-md border">
            <selectedView.Component
              title={title}
              options={watchOptions}
              date={navigationDate}
              onNavigate={(date) => {
                setValue("navigationDate", date.toISOString());
              }}
              onChange={(options) => {
                setValue("options", options);
                if (
                  options.length === 0 ||
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
          </div>
        </FormItem>
      </form>
    </Form>
  );
};

export default React.memo(PollOptionsForm);
