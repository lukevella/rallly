"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { toast } from "@rallly/ui/sonner";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const NONE_VALUE = "none";

export function DefaultCalendarSelect() {
  const { data: defaultCalendar } = trpc.calendars.getDefault.useQuery();
  const { data: connections } = trpc.calendars.list.useQuery();

  const setDefaultCalendar = trpc.calendars.setDefault.useMutation();
  const { t } = useTranslation();
  const onValueChange = (value: string) => {
    toast.promise(
      setDefaultCalendar.mutateAsync({
        calendarId: value === NONE_VALUE ? null : value,
      }),
      {
        loading: t("settingDefaultCalendar", {
          defaultValue: "Setting default calendar...",
        }),
        success: t("defaultCalendarSetSuccess", {
          defaultValue: "Default calendar set successfully",
        }),
        error: t("defaultCalendarSetError", {
          defaultValue: "Failed to set default calendar",
        }),
      },
    );
  };

  return (
    <Select
      defaultValue={defaultCalendar?.defaultDestinationCalendarId ?? NONE_VALUE}
      onValueChange={onValueChange}
      disabled={setDefaultCalendar.isPending}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>
          <Trans
            i18nKey="defaultCalendarNone"
            defaults="No calendar selected"
          />
        </SelectItem>
        {connections?.map((connection) => (
          <SelectGroup key={connection.id}>
            <SelectLabel>{connection.email}</SelectLabel>
            {connection.providerCalendars.map((calendar) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                {calendar.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
