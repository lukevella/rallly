"use client";
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
import { Trans } from "@/components/trans";
import { trpc } from "@/trpc/client";

export function DefaultCalendarSelect() {
  const { data: defaultCalendar } = trpc.calendars.getDefault.useQuery();
  const { data: connections } = trpc.calendars.list.useQuery();

  return (
    <Select value={defaultCalendar?.defaultDestinationCalendarId ?? "none"}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
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
