import type { DateTimeOption } from "./poll-options-form/types";

export interface PollDetailsData {
  title: string;
  location: string;
  description: string;
}

export type PollOptionsData = {
  navigationDate: string; // used to navigate to the right part of the calendar
  duration: number; // duration of the event in minutes
  timeZone: string;
  lockTimeZone: boolean; // when true, everyone sees the same wall-clock time (no per-viewer conversion)
  allDay: boolean; // derived: options are whole-day dates rather than time slots
  view: string;
  options: DateTimeOption[];
};

export type PollSettingsFormData = {
  requireParticipantEmail: boolean;
  hideParticipants: boolean;
  hideScores: boolean;
  disableComments: boolean;
};

export type NewEventData = PollDetailsData &
  PollOptionsData &
  PollSettingsFormData;

// biome-ignore lint/suspicious/noExplicitAny: Fix this later
export interface PollFormProps<T extends Record<string, any>> {
  onSubmit?: (data: T) => void;
  onChange?: (data: Partial<T>) => void;
  defaultValues?: Partial<T>;
  name?: string;
  className?: string;
}
