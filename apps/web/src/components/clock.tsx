"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Label } from "@rallly/ui/label";
import { GlobeIcon } from "lucide-react";
import React from "react";
import { useInterval } from "react-use";
import spacetime from "spacetime";
import soft from "timezone-soft";
import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { getCityFromTimezoneId } from "@/components/time-zone-picker/timezone-data";
import { usePreferences } from "@/contexts/preferences";
import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import { useTimezone } from "@/lib/timezone/client/context";
import { useDayjs } from "@/utils/dayjs";

export const TimePreferences = () => {
  const { updatePreferences } = usePreferences();
  const { timeFormat, timeZone } = useDayjs();

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>
          <Trans i18nKey="timeZone" />
        </Label>
        <TimeZoneSelect
          value={timeZone}
          onValueChange={(newTimeZone) => {
            updatePreferences({ timeZone: newTimeZone });
          }}
        />
      </div>
      <div className="grid gap-2">
        <Label>
          <Trans i18nKey="timeFormat" />
        </Label>
        <TimeFormatPicker
          value={timeFormat}
          onChange={(newTimeFormat) => {
            updatePreferences({ timeFormat: newTimeFormat });
          }}
        />
      </div>
    </div>
  );
};

export const Clock = ({ className }: { className?: string }) => {
  const { timeZone, timeFormat } = useDayjs();
  const timeZoneDisplayFormat = soft(timeZone)[0];
  const now = spacetime.now(timeZone);
  const standardAbbrev = timeZoneDisplayFormat.standard.abbr;
  const dstAbbrev = timeZoneDisplayFormat.daylight?.abbr;
  const abbrev = now.isDST() ? dstAbbrev : standardAbbrev;
  const [time, setTime] = React.useState(new Date());
  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return (
    <span
      key={timeFormat}
      className={cn("inline-block font-medium tabular-nums", className)}
    >{`${dayjs(time).tz(timeZone).format("LT")} ${abbrev}`}</span>
  );
};

export const TimesShownIn = () => {
  const { timezone } = useTimezone();
  return (
    <ClockPreferences>
      <Button type="button" variant="ghost">
        <GlobeIcon data-icon="inline-start" />
        <Trans
          i18nKey="cityTime"
          defaults="{city} Time"
          values={{ city: getCityFromTimezoneId(timezone) }}
        />
      </Button>
    </ClockPreferences>
  );
};

export const ClockPreferences = ({ children }: React.PropsWithChildren) => {
  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="clockPreferences" defaults="Clock Preferences" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="clockPreferencesDescription"
              defaults="Set your preferred time zone and time format."
            />
          </DialogDescription>
        </DialogHeader>
        <div className="grid h-24 items-center justify-center rounded-md bg-muted font-bold text-2xl">
          <Clock />
        </div>
        <TimePreferences />
      </DialogContent>
    </Dialog>
  );
};
