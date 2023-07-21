import { PollSettingsFormData } from "@/components/forms/poll-settings";

import { PollDetailsData } from "./poll-details-form";
import { PollOptionsData } from "./poll-options-form/poll-options-form";

export type NewEventData = PollDetailsData &
  PollOptionsData &
  PollSettingsFormData;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PollFormProps<T extends Record<string, any>> {
  onSubmit?: (data: T) => void;
  onChange?: (data: Partial<T>) => void;
  defaultValues?: Partial<T>;
  name?: string;
  className?: string;
}
