export type ScheduledEvent = {
  id: string;
  title: string;
  start: Date;
  duration: number;
  timeZone: string | null;
  participants: { name: string }[];
};
