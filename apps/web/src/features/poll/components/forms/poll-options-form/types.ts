export type DateOption = {
  type: "date";
  /**
   * The stored option's id when this came from an existing poll. Lets an
   * in-place edit target the exact row instead of matching by encoded
   * date/time, which is ambiguous when two options share a start and duration.
   * Unset for options created in the form.
   */
  id?: string;
  date: string;
  /** Max number of "yes" votes this option accepts. Unset means no limit. */
  maxParticipants?: number;
};

export type TimeOption = {
  type: "timeSlot";
  /** See {@link DateOption.id}. */
  id?: string;
  start: string;
  end: string;
  /** Max number of "yes" votes this option accepts. Unset means no limit. */
  maxParticipants?: number;
};

export type DateTimeOption = DateOption | TimeOption;

export interface DateTimePickerProps {
  title?: string;
  options: DateTimeOption[];
  date?: Date;
  onNavigate: (date: Date) => void;
  onChange: (options: DateTimeOption[]) => void;
  duration: number;
  onChangeDuration: (duration: number) => void;
  scrollToTime?: Date;
  /** The poll's zone, when its times convert; undefined for floating polls. */
  timeZone?: string;
}
