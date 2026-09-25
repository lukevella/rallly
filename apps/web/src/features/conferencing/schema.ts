import * as z from "zod";

// Providers Rallly can mint links for. Distinct from the stored-link union
// below, which also covers links pasted by hand (custom) and phone dial-ins.
export const conferencingProviderSchema = z.enum(["zoom", "meet"]);
export type ConferencingProvider = z.infer<typeof conferencingProviderSchema>;

// What a poll records before there is a link: a provider to mint with at
// finalize, or a call the organizer names themselves (any service, no
// account needed). The link is optional: most organizers announce the tool
// first and send the link once the time is set.
export const pollConferencingSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("zoom") }),
  z.object({ provider: z.literal("meet") }),
  z.object({
    provider: z.literal("custom"),
    label: z.string().trim().min(1).max(100),
    uri: z.url().optional(),
  }),
]);
export type PollConferencing = z.infer<typeof pollConferencingSchema>;

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
