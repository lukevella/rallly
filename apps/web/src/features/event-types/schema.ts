import { z } from "zod";
import { locationSchema } from "@/lib/location";

export const eventTypeInputSchema = z.object({
  name: z.string().min(1).max(255),
  duration: z.number().int().positive(),
  capacity: z.number().int().positive().nullable().optional(),
  description: z.string().max(2000).optional(),
  location: locationSchema.optional(),
});

export type EventTypeInput = z.infer<typeof eventTypeInputSchema>;

export const updateEventTypeInputSchema = eventTypeInputSchema.extend({
  id: z.string(),
});

export type UpdateEventTypeInput = z.infer<typeof updateEventTypeInputSchema>;
