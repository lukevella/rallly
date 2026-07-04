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
import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { getCityFromTimezoneId } from "@/components/time-zone-picker/timezone-data";
import { Trans } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useDeviceDateTime } from "@/lib/datetime/device";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import { Time } from "@/lib/datetime/time";

const TimePreferences = () => {
  const { setTimeZone, setTimeFormat } = useDeviceDateTime();
  const { locale, timeZone, timeFormat } = useDateTimeConfig();

  // When there's no explicit preference, show the locale's default format.
  const resolvedTimeFormat = timeFormat ?? getLocaleDefaults(locale).timeFormat;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>
          <Trans i18nKey="timeZone" />
        </Label>
        <TimeZoneSelect value={timeZone} onValueChange={setTimeZone} />
      </div>
      <div className="grid gap-2">
        <Label>
          <Trans i18nKey="timeFormat" />
        </Label>
        <TimeFormatPicker value={resolvedTimeFormat} onChange={setTimeFormat} />
      </div>
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => {
  const [time, setTime] = React.useState(() => new Date());
  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return (
    <Time
      value={time}
      preset="time"
      showTimeZone
      className={cn("inline-block font-medium tabular-nums", className)}
    />
  );
};

const ClockPreferences = ({ children }: React.PropsWithChildren) => {
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

export const TimesShownIn = () => {
  const { timeZone } = useDateTimeConfig();

  if (!timeZone) {
    return null;
  }

  return (
    <ClockPreferences>
      <Button type="button" variant="ghost">
        <GlobeIcon data-icon="inline-start" />
        <Trans
          i18nKey="cityTime"
          defaults="{city} Time"
          values={{ city: getCityFromTimezoneId(timeZone) }}
        />
      </Button>
    </ClockPreferences>
  );
};
