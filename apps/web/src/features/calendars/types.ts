export type CalendarProvider = "google" | "microsoft";

export type CalendarConnectionStatus =
  | "active"
  | "expired"
  | "error"
  | "revoked";

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: CalendarProvider;
  providerAccountId: string;
  email: string;
  displayName?: string;
  status: CalendarConnectionStatus;
  lastSyncedAt?: Date;
  syncErrors: number;
  primaryCalendarId?: string;
  selectedCalendars?: string[];
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isBusy: boolean;
  title?: string; // Optional: what the person is busy with
}

export interface AvailabilityResult {
  connectionId: string;
  provider: CalendarProvider;
  email: string;
  timeSlots: TimeSlot[];
  error?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

export interface TimeRange {
  startTime: Date;
  endTime: Date;
}

export interface Calendar {
  id: string;
  name: string;
  primary?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  isBusy: boolean;
}
