import { CalendarIcon, TableIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Form, FormItem } from "@rallly/ui/form";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm, useFormContext } from "react-hook-form";

import { getBrowserTimeZone } from "../../../utils/date-time-utils";
import { useModal } from "../../modal";
import TimeZonePicker from "../../time-zone-picker";
import { NewEventData, PollFormProps } from "../types";
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
> = ({ onChange, title }) => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

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

  const watchView = watch("options.view");

  const selectedView = React.useMemo(
    () => views.find((view) => view.value === watchView) ?? views[0],
    [views, watchView],
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const watchOptions = watch("options.options", [])!;
  const watchDuration = watch("options.duration");
  const watchTimeZone = watch("options.timeZone");

  const datesOnly = watchOptions.every((option) => option.type === "date");

  const [dateOrTimeRangeModal, openDateOrTimeRangeModal] = useModal({
    title: t("mixedOptionsTitle"),
    description: t("mixedOptionsDescription"),
    okText: t("mixedOptionsKeepTimes"),
    onOk: () => {
      setValue(
        "options.options",
        watchOptions.filter((option) => option.type === "timeSlot"),
      );
      if (!watchTimeZone) {
        setValue("options.timeZone", getBrowserTimeZone());
      }
    },
    cancelText: t("mixedOptionsKeepDates"),
    onCancel: () => {
      setValue(
        "options.options",
        watchOptions.filter((option) => option.type === "date"),
      );
      setValue("options.timeZone", "");
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

  const watchNavigationDate = watch("options.navigationDate");
  const navigationDate = new Date(watchNavigationDate ?? Date.now());

  const [calendarHelpModal, openHelpModal] = useModal({
    overlayClosable: true,
    title: t("calendarHelpTitle"),
    description: t("calendarHelp"),
    okText: t("ok"),
  });

  return (
    <div>
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
      <div>
        <selectedView.Component
          title={title}
          options={watchOptions}
          date={navigationDate}
          onNavigate={(date) => {
            setValue("options.navigationDate", date.toISOString());
          }}
          onChange={(options) => {
            setValue("options.options", options);
            if (
              options.length === 0 ||
              options.every((option) => option.type === "date")
            ) {
              // unset the timeZone if we only have date option
              setValue("options.timeZone", "");
            }
            if (
              options.length > 0 &&
              !formState.touchedFields.options?.timeZone &&
              options.every((option) => option.type === "timeSlot")
            ) {
              // set timeZone if we are adding time ranges and we haven't touched the timeZone field
              setValue("options.timeZone", getBrowserTimeZone());
            }
          }}
          duration={watchDuration}
          onChangeDuration={(duration) => {
            setValue("options.duration", duration);
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(PollOptionsForm);
