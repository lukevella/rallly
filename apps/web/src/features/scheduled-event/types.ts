import type { Conferencing } from "@/features/conferencing/schema";
import type { ScheduledEventStatus } from "@/features/scheduled-event/schema";
import type { DateInput } from "@/lib/datetime/types";

export type EventRow = {
  id: string;
  title: string;
  status: ScheduledEventStatus;
  start: DateInput;
  end: DateInput;
  allDay: boolean;
  timeZone: string | null;
  conferencing: Conferencing | null;
  attendeeCount: number;
  createdBy: { name: string; image?: string };
};
