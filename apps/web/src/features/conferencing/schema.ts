import * as z from "zod";

const webConferencingSchema = z.object({
  provider: z.enum(["zoom", "meet", "teams"]),
  uri: z.url(),
  meetingId: z.string().optional(),
  password: z.string().optional(),
});

const phoneConferencingSchema = z.object({
  provider: z.literal("phone"),
  number: z.string().min(1),
  extension: z.string().optional(),
});

const customConferencingSchema = z.object({
  provider: z.literal("custom"),
  uri: z.url(),
  label: z.string().min(1),
});

export const conferencingSchema = z.discriminatedUnion("provider", [
  webConferencingSchema,
  phoneConferencingSchema,
  customConferencingSchema,
]);

export type Conferencing = z.infer<typeof conferencingSchema>;
