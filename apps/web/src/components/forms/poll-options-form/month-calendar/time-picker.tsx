import { Button } from "@rallly/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import dayjs from "dayjs";
import * as React from "react";

import { getDuration } from "@/utils/date-time-utils";

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
  const [open, setOpen] = React.useState(false);
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
      <SelectTrigger asChild>
        <Button className={className}>
          <SelectValue placeholder="Select time" />
        </Button>
      </SelectTrigger>
      <SelectContent>
        {open ? (
          getOptions().map((option) => {
            return (
              <SelectItem key={option} value={dayjs(option).toISOString()}>
                <div className="flex items-center gap-2">
                  <span>{dayjs(option).format("LT")}</span>
                  {after ? (
                    <span className="text-sm text-gray-500">
                      {getDuration(dayjs(after), dayjs(option))}
                    </span>
                  ) : null}
                </div>
              </SelectItem>
            );
          })
        ) : (
          <SelectItem value={dayjs(value).toISOString()}>
            <div className="flex items-center gap-2">
              <span>{dayjs(value).format("LT")}</span>
              {after ? (
                <span className="text-sm text-gray-500">
                  {getDuration(dayjs(after), dayjs(value))}
                </span>
              ) : null}
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default TimePicker;
