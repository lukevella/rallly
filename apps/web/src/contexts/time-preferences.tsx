import { trpc } from "@rallly/backend";
import { GlobeIcon } from "@rallly/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import dayjs, { Dayjs } from "dayjs";
import React from "react";

import { TimesShownIn } from "@/components/clock";
import { TimeZoneCommand } from "@/components/time-zone-picker/time-zone-select";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

export const TimePreferences = () => {
  const { timeZone } = useDayjs();
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
          timeZone: newPreferences.timeZone ?? oldPreferences?.timeZone ?? null,
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
    <Popover open={open} onOpenChange={setIsOpen}>
      <PopoverTrigger className="inline-flex items-center gap-x-2 text-sm hover:underline">
        <GlobeIcon className="h-4 w-4" />
        <TimesShownIn />
      </PopoverTrigger>
      <PopoverContent align="center" className="p-0">
        <TimeZoneCommand
          value={timeZone}
          onSelect={(value) => {
            updatePreferences.mutate({
              timeZone: value,
            });
            setIsOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
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
