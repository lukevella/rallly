import { z } from "zod";

export const pollStatusSchema = z.enum(["live", "paused", "finalized"]);

export type PollStatus = z.infer<typeof pollStatusSchema>;
