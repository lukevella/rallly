import * as z from "zod";

export const calendarProviderSchema = z.enum(["google", "microsoft"]);
export type CalendarProvider = z.infer<typeof calendarProviderSchema>;

export const calendarConnectionStatusSchema = z.enum([
  "active",
  "expired",
  "error",
  "revoked",
]);

export const timeSlotSchema = z.object({
  start: z.date(),
  end: z.date(),
  isBusy: z.boolean(),
  title: z.string().optional(),
});

export const availabilityRequestSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  connectionIds: z.array(z.string()).optional(),
});

export const oauthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  scopes: z.array(z.string()),
});

export const userInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export const calendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  primary: z.boolean().optional(),
});

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.date(),
  end: z.date(),
  isAllDay: z.boolean(),
  isBusy: z.boolean(),
});
