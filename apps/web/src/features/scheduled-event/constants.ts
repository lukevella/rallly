export const isScheduledEventEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.SCHEDULED_EVENTS_ENABLED === "true";

export const scheduledEventTag = (id: string) => `scheduled-event:${id}`;
