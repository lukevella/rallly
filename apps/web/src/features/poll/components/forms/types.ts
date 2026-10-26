import type { ConferencingProvider } from "@/features/conferencing/schema";
import type { DateTimeOption } from "./poll-options-form/types";

export interface PollDetailsData {
  title: string;
  location: string;
  description: string;
  // Empty string is "none"; the form persists to storage, which has no undefined.
  conferencingProvider?: ConferencingProvider | "custom" | "";
  conferencingUrl?: string;
  conferencingLabel?: string;
}

export type PollOptionsData = {
  navigationDate: string; // used to navigate to the right part of the calendar
  duration: number; // duration of the event in minutes
  timeZone: string;
  lockTimeZone: boolean; // when true, everyone sees the same wall-clock time (no per-viewer conversion)
  view: string;
  options: DateTimeOption[];
};

export type PollSettingsFormData = {
  requireParticipantEmail: boolean;
  hideParticipants: boolean;
  hideScores: boolean;
  enableComments: boolean;
  allowTentativeVotes: boolean;
  /** `YYYY-MM-DD` and `HH:mm` in the browser's zone; both empty for none. */
  closesAtDate?: string;
  closesAtTime?: string;
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
