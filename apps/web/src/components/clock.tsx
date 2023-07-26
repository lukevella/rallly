import { trpc } from "@rallly/backend";
import { GlobeIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Label } from "@rallly/ui/label";
import dayjs from "dayjs";
import React from "react";
import { useInterval } from "react-use";
import spacetime from "spacetime";
import soft from "timezone-soft";

import { TimeFormatPicker } from "@/components/time-format-picker";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import { useDayjs } from "@/utils/dayjs";

export const TimePreferences = () => {
  const { timeZone, timeFormat } = useDayjs();
  const queryClient = trpc.useContext();

  const { data } = trpc.userPreferences.get.useQuery();

  const updatePreferences = trpc.userPreferences.update.useMutation({
    onMutate: (newPreferences) => {
      queryClient.userPreferences.get.setData(undefined, (oldPreferences) => {
        if (!oldPreferences) {
          return null;
        }
        return {
          ...oldPreferences,
          timeFormat: newPreferences.timeFormat ?? oldPreferences?.timeFormat,
          timeZone: newPreferences.timeZone ?? oldPreferences?.timeZone ?? null,
          weekStart: newPreferences.weekStart ?? oldPreferences?.weekStart,
        };
      });
    },
    onSuccess: () => {
      queryClient.userPreferences.get.invalidate();
    },
  });

  if (data === undefined) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>
          <Trans i18nKey="timeZone" />
        </Label>
        <TimeZoneSelect
          value={timeZone}
          onValueChange={(newTimeZone) => {
            updatePreferences.mutate({
              timeZone: newTimeZone,
            });
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
            updatePreferences.mutate({
              timeFormat: newTimeFormat,
            });
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
  const { timeZone } = useDayjs();
  const timeZoneDisplayFormat = soft(timeZone)[0];
  const now = spacetime.now(timeZone);
  const standard = timeZoneDisplayFormat.standard.name;
  const dst = timeZoneDisplayFormat.daylight?.name;
  const timeZoneName = now.isDST() ? dst : standard;

  return (
    <ClockPreferences>
      <button className="inline-flex items-center gap-x-2 text-sm hover:underline">
        <GlobeIcon className="h-4 w-4" />
        <Trans i18nKey="timeShownIn" values={{ timeZone: timeZoneName }} />
      </button>
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
        <div className="bg-muted grid h-24 items-center justify-center rounded-md text-2xl font-bold">
          <Clock />
        </div>
        <TimePreferences />
      </DialogContent>
    </Dialog>
  );
};
