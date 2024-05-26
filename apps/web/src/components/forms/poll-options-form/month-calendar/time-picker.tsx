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
  value?: string;
  after?: string;
  className?: string;
  onChange?: (value: string) => void;
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
      return [dayjs(value).format("YYYY-MM-DDTHH:mm:ss")];
    }
    let cursor = after
      ? dayjs(after).add(15, "minutes")
      : dayjs(value).startOf("day");

    const res: string[] = [];
    while (cursor.isSame(value, "day")) {
      res.push(cursor.format("YYYY-MM-DDTHH:mm:ss"));
      cursor = cursor.add(15, "minutes");
    }
    return res;
  }, [after, open, value]);

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
      <SelectTrigger asChild>
        <Button size="sm" className={className}>
          <SelectValue placeholder="Select time" />
        </Button>
      </SelectTrigger>
      <SelectContent>
        {open ? (
          getOptions().map((option, i) => {
            return (
              <SelectItem
                key={i}
                value={dayjs(option).format("YYYY-MM-DDTHH:mm:ss")}
              >
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
          <SelectItem value={dayjs(value).format("YYYY-MM-DDTHH:mm:ss")}>
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
