import { PollDetailsData } from "./poll-details-form";
import { PollOptionsData } from "./poll-options-form/poll-options-form";
import { UserDetailsData } from "./user-details-form";

export interface NewEventData {
  currentStep: number;
  eventDetails?: Partial<PollDetailsData>;
  options?: Partial<PollOptionsData>;
  userDetails?: Partial<UserDetailsData>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PollFormProps<T extends Record<string, any>> {
  onSubmit: (data: T) => void;
  onChange?: (data: Partial<T>) => void;
  defaultValues?: Partial<T>;
  name?: string;
  className?: string;
}
