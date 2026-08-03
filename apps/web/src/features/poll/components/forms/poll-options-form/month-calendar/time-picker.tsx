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
import { dayjs } from "@/lib/dayjs";

export interface TimePickerProps {
  value?: Date;
  after?: Date;
  className?: string;
  onChange?: (value: Date) => void;
}

const TimePicker: React.FunctionComponent<TimePickerProps> = ({
  value,
  onChange,
  className,
  after,
}) => {
  const { locale, timeFormat } = useDateTimeConfig();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  // The form works in naive local times, so options format in the system zone.
  const formatTime = (time: string | Date) =>
    formatDateTime(new Date(time), { preset: "time", locale, timeFormat });

  const getOptions = React.useCallback(() => {
    if (!open) {
      return [dayjs(value).toISOString()];
    }
    let cursor = after
      ? dayjs(after).add(15, "minutes")
      : dayjs(value).startOf("day");

    const res: string[] = [];

    if (after) {
      let cursor = dayjs(after).add(15, "minutes");
      while (cursor.diff(after, "hours") < 24) {
        res.push(cursor.toISOString());
        cursor = cursor.add(15, "minutes");
      }
    } else {
      cursor = dayjs(value).startOf("day");
      while (cursor.isSame(value, "day")) {
        res.push(cursor.toISOString());
        cursor = cursor.add(15, "minutes");
      }
    }
    return res;
  }, [after, open, value]);

  return (
    <Select
      value={value?.toISOString()}
      onValueChange={(newValue) => {
        if (newValue) {
          onChange?.(new Date(newValue));
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
            selected ? (
              <div className="flex items-center gap-2">
                <span>{formatTime(selected)}</span>
                {after ? (
                  <Duration
                    className="text-muted-foreground text-sm"
                    minutes={dayjs(selected).diff(after, "minute")}
                  />
                ) : null}
              </div>
            ) : (
              t("timePickerSelectTime", { defaultValue: "Select time" })
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {open ? (
          getOptions().map((option) => {
            return (
              <SelectItem key={option} value={dayjs(option).toISOString()}>
                <div className="flex items-center gap-2">
                  <span>{formatTime(option)}</span>
                  {after ? (
                    <Duration
                      className="text-muted-foreground text-sm"
                      minutes={dayjs(option).diff(after, "minute")}
                    />
                  ) : null}
                </div>
              </SelectItem>
            );
          })
        ) : (
          <SelectItem value={dayjs(value).toISOString()}>
            <div className="flex items-center gap-2">
              <span>{formatTime(dayjs(value).toDate())}</span>
              {after ? (
                <Duration
                  className="text-muted-foreground text-sm"
                  minutes={dayjs(value).diff(after, "minute")}
                />
              ) : null}
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default TimePicker;
