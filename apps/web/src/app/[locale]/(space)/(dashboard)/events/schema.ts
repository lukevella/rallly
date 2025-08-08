import { z } from "zod";
import { statusSchema } from "@/features/scheduled-event/schema";

export const DEFAULT_PAGE_SIZE = 10;

export const pageSchema = z.coerce.number().optional().default(1);

export const querySchema = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

export const eventsStatusSchema = statusSchema
  .optional()
  .catch("upcoming")
  .default("upcoming");

export const memberSchema = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

export const eventsSearchParamsSchema = z.object({
  status: eventsStatusSchema,
  page: pageSchema,
  q: querySchema,
  member: memberSchema,
});
