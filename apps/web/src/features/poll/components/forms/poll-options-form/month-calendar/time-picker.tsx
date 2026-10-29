import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import * as React from "react";

import { useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { Duration } from "@/lib/datetime/duration";
import { formatDateTime } from "@/lib/datetime/format";
import { wallTimeDiffInMinutes } from "@/lib/datetime/wall-time";
import { getTimeOptions } from "../utils";
import { FLOATING_TIME_ZONE, floatingToDate } from "../week-calendar-utils";

export interface TimePickerProps {
  /** Floating wall-clock time, YYYY-MM-DDTHH:mm:ss. */
  value?: string;
  /** When set, offers the 24 hours after this time instead of `value`'s day. */
  after?: string;
  /** The poll's zone; times its clocks skip aren't offered. */
  timeZone?: string;
  className?: string;
  onChange?: (value: string) => void;
}

const TimePicker: React.FunctionComponent<TimePickerProps> = ({
  value,
  onChange,
  className,
  after,
  timeZone,
}) => {
  const { locale, timeFormat } = useDateTimeConfig();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const formatTime = (time: string) =>
    formatDateTime(floatingToDate(time), {
      preset: "time",
      locale,
      timeFormat,
      timeZone: FLOATING_TIME_ZONE,
    });

  const options = React.useMemo(
    () =>
      value
        ? open
          ? getTimeOptions({ value, after, timeZone })
          : [value]
        : [],
    [after, open, timeZone, value],
  );

  const renderOption = (option: string) => (
    <div className="flex items-center gap-2">
      <span>{formatTime(option)}</span>
      {after ? (
        <Duration
          className="text-muted-foreground text-sm"
          minutes={wallTimeDiffInMinutes(after, option)}
        />
      ) : null}
    </div>
  );

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        if (newValue) {
          onChange?.(newValue);
        }
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={t("timePickerSelectTime", {
            defaultValue: "Select time",
          })}
        >
          {(selected: string | null | undefined) =>
            selected
              ? renderOption(selected)
              : t("timePickerSelectTime", { defaultValue: "Select time" })
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {renderOption(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimePicker;
