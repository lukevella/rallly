export interface CalendarService {
  listCalendars: () => Promise<CalendarInfo[]>;
}

export type CalendarInfo = {
  id: string;
  name: string;
  timeZone?: string;
  isPrimary: boolean;
  isSelected: boolean;
  isDeleted: boolean;
  isWritable: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: any is used to store the raw data from the provider
  _rawData: any;
};
