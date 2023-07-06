export type DateOption = {
  type: "date";
  date: string;
};

export type TimeOption = {
  type: "timeSlot";
  start: string;
  duration: number;
  end: string;
};

export type DateTimeOption = DateOption | TimeOption;

export interface DateTimePickerProps {
  title?: string;
  options: DateTimeOption[];
  date: Date;
  onNavigate: (date: Date) => void;
  onChange: (options: DateTimeOption[]) => void;
  duration: number;
  onChangeDuration: (duration: number) => void;
  scrollToTime?: Date;
}
