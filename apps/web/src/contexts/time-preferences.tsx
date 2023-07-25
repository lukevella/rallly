import { trpc } from "@rallly/backend";
import { GlobeIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@rallly/ui/dialog";
import dayjs, { Dayjs } from "dayjs";
import React from "react";

import { TimeFormatPicker } from "@/components/time-format-picker";
import {
  TimeZoneCommand,
  timeZones,
} from "@/components/time-zone-picker/time-zone-select";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

export const TimePreferences = () => {
  const poll = usePoll();

  const { timeZone, timeFormat } = useDayjs();
  const queryClient = trpc.useContext();

  const [open, setIsOpen] = React.useState(false);
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
    <div className="flex justify-between gap-x-4 overflow-x-auto  sm:overflow-x-visible">
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button icon={GlobeIcon} disabled={!poll.timeZone}>
            {poll.timeZone ? (
              <Trans
                i18nKey="timeShownIn"
                defaults="Times shown in {timeZone}"
                values={{
                  timeZone: timeZones[timeZone as keyof typeof timeZones],
                }}
              />
            ) : (
              <Trans
                i18nKey="timeShownInLocalTime"
                defaults="Times shown in local time"
              />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <TimeZoneCommand
            value={timeZone}
            onSelect={(value) => {
              updatePreferences.mutate({
                timeZone: value,
              });
              setIsOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <div>
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
export const useDateFormatter = () => {
  const { timeZone } = usePoll();
  const { timeZone: preferredTimeZone } = useDayjs();

  return (date: Date | Dayjs) => {
    if (timeZone) {
      return dayjs(date).utc().tz(timeZone, true).tz(preferredTimeZone);
    }

    return dayjs(date).utc();
  };
};
