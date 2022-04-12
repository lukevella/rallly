import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { getBrowserTimeZone } from "../../../utils/date-time-utils";
import FullPageLoader from "../../full-page-loader";
import Calendar from "../../icons/calendar.svg";
import Table from "../../icons/table.svg";
import { useModal } from "../../modal";
import TimeZonePicker from "../../time-zone-picker";
import { PollFormProps } from "../types";
import { DateTimeOption } from "./types";

const WeekCalendar = React.lazy(() => import("./week-calendar"));
const MonthCalendar = React.lazy(() => import("./month-calendar"));

export type PollOptionsData = {
  navigationDate: string; // used to navigate to the right part of the calendar
  duration: number; // duration of the event in minutes
  timeZone: string;
  view: string;
  options: DateTimeOption[];
};

const PollOptionsForm: React.VoidFunctionComponent<
  PollFormProps<PollOptionsData> & { title?: string }
> = ({ name, defaultValues, onSubmit, onChange, title, className }) => {
  const { t } = useTranslation("app");
  const { control, handleSubmit, watch, setValue, formState } =
    useForm<PollOptionsData>({
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

  const views = React.useMemo(() => {
    const res = [
      {
        label: "Month view",
        value: "month",
        Component: MonthCalendar,
      },
      {
        label: "Week view",
        value: "week",
        Component: WeekCalendar,
      },
    ];
    return res;
  }, []);

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
    title: "Wait a minute… 🤔",
    description:
      "You can't have both time and date options in the same poll. Which would you like to keep?",
    okText: "Keep time options",
    onOk: () => {
      setValue(
        "options",
        watchOptions.filter((option) => option.type === "timeSlot"),
      );
      if (!watchTimeZone) {
        setValue("timeZone", getBrowserTimeZone());
      }
    },
    cancelText: "Keep date options",
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
    title: "Forget something?",
    description: t("calendarHelp"),
    okText: t("ok"),
  });

  return (
    <form
      id={name}
      className={clsx("max-w-full", className)}
      style={{ width: 1024 }}
      onSubmit={handleSubmit(onSubmit, openHelpModal)}
    >
      {calendarHelpModal}
      {dateOrTimeRangeModal}
      <div className="py-3 space-y-2 lg:space-y-0 border-b w-full lg:space-x-2 bg-slate-50 items-center lg:flex px-4">
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
          <div className="segment-button w-full">
            <button
              className={clsx({
                "segment-button-active": selectedView.value === "month",
              })}
              onClick={() => {
                setValue("view", "month");
              }}
              type="button"
            >
              <Calendar className="h-5 w-5 mr-2" /> Month view
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
              <Table className="h-5 w-5 mr-2" /> Week view
            </button>
          </div>
        </div>
      </div>
      <div className="w-full relative">
        <React.Suspense
          fallback={
            <FullPageLoader className="h-[400px]">Loading…</FullPageLoader>
          }
        >
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
        </React.Suspense>
      </div>
    </form>
  );
};

export default React.memo(PollOptionsForm);
