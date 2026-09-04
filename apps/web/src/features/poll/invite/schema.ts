import * as z from "zod";

export const sendPollInviteSchema = z.object({
  pollId: z.string().min(1),
  // Normalized before validation so "  Jessie@Example.com " matches the
  // citext unique index the same way the stored row does.
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export const recordPollInviteOpenSchema = z.object({
  pollId: z.string().min(1),
  token: z.string().min(1),
});

export const revokePollInviteSchema = z.object({
  pollId: z.string().min(1),
  inviteId: z.string().min(1),
});
