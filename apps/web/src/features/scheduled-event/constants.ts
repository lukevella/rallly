export const isScheduledEventEnabled = process.env.NODE_ENV === "development";

export const scheduledEventTag = (id: string) => `scheduled-event:${id}`;
