import { TimeFormat } from "@rallly/database";
import { Settings2Icon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import dayjs from "dayjs";
import { createStateContext } from "react-use";

import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { usePoll } from "@/contexts/poll";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

export const [useTimeZone, TimeZoneProvider] = createStateContext<string>(
  getBrowserTimeZone(),
);

export const [useTimeFormat, TimeFormatProvider] =
  createStateContext<TimeFormat>("hours24");

export const TimePreferences = () => {
  const poll = usePoll();

  const [timeZone, setTimeZone] = useTimeZone();
  const [timeFormat, setTimeFormat] = useTimeFormat();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button icon={Settings2Icon}></Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-2">
          {poll.timeZone ? (
            <div>
              <TimeZoneSelect value={timeZone} onValueChange={setTimeZone} />
            </div>
          ) : null}
          <div>
            <TimeFormatPicker value={timeFormat} onChange={setTimeFormat} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const useDateFormatter = () => {
  const { timeZone } = usePoll();
  const [preferredTimeZone] = useTimeZone();

  return (date: Date) => {
    if (timeZone) {
      return dayjs(date).utc().tz(timeZone, true).tz(preferredTimeZone);
    }

    return dayjs(date).utc();
  };
};
