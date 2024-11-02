import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  locale: z.string(),
  createdAt: z.string(),
  timeZone: z.string().optional().catch(undefined),
  weekStart: z.number().optional().catch(undefined),
  timeFormat: z.enum(["hours12", "hours24"]).optional().catch(undefined),
});

export type User = z.infer<typeof userSchema>;
