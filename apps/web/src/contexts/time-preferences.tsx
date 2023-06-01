import { TimeFormat } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import React from "react";
import { createStateContext } from "react-use";

import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneCommand } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

export const [useTimeZone, TimeZoneProvider] = createStateContext<string>(
  getBrowserTimeZone(),
);

export const [useTimeFormat, TimeFormatProvider] =
  createStateContext<TimeFormat>("hours24");

export const TimePreferences = () => {
  const [isTimeZoneDialogOpen, setIsTimeZoneDialogOpen] = React.useState(false);
  const [timeZone, setTimeZone] = useTimeZone();
  const [timeFormat, setTimeFormat] = useTimeFormat();
  return (
    <div className="flex max-w-full flex-col justify-between gap-2 md:flex-row">
      <Popover
        open={isTimeZoneDialogOpen}
        onOpenChange={setIsTimeZoneDialogOpen}
      >
        <PopoverTrigger asChild={true}>
          <Button
            type="button"
            className="min-w-0"
            onClick={() => {
              setIsTimeZoneDialogOpen(true);
            }}
          >
            <span className="min-w-0 truncate">
              <Trans
                defaults="Show times in {timeZone}"
                i18nKey="showTimesIn"
                values={{ timeZone }}
              />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <TimeZoneCommand
            value={timeZone}
            onSelect={(newTimeZone) => {
              setTimeZone(newTimeZone);
              setIsTimeZoneDialogOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <TimeFormatPicker value={timeFormat} onChange={setTimeFormat} />
    </div>
  );
};
