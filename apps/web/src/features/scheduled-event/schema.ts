import * as z from "zod";

export const statusSchema = z.enum([
  "upcoming",
  "unconfirmed",
  "past",
  "canceled",
]);

export type Status = z.infer<typeof statusSchema>;

export const scheduledEventStatusSchema = z.enum([
  "confirmed",
  "unconfirmed",
  "canceled",
]);

export type ScheduledEventStatus = z.infer<typeof scheduledEventStatusSchema>;
