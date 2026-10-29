export type DateOption = {
  type: "date";
  date: string;
  /** Max number of "yes" votes this option accepts. Unset means no limit. */
  maxParticipants?: number;
};

export type TimeOption = {
  type: "timeSlot";
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
