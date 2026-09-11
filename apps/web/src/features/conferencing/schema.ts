import * as z from "zod";

// Providers Rallly can mint links for. Distinct from the stored-link union
// below, which also covers links pasted by hand (custom) and phone dial-ins.
export const conferencingProviderSchema = z.enum(["zoom", "meet"]);
export type ConferencingProvider = z.infer<typeof conferencingProviderSchema>;

export const disconnectConferencingConnectionSchema = z.object({
  id: z.string(),
});

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
