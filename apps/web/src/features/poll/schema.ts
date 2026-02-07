import * as z from "zod";

export const pollStatusSchema = z.enum([
  "open",
  "closed",
  "scheduled",
  "canceled",
]);

export type PollStatus = z.infer<typeof pollStatusSchema>;
