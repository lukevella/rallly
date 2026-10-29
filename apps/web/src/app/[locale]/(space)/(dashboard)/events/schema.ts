import * as z from "zod";
import { statusSchema } from "@/features/scheduled-event/schema";

export const DEFAULT_PAGE_SIZE = 50;

export const pageSchema = z.coerce.number().int().min(1).catch(1);

export const pageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .transform((val) => Math.min(val, 100))
  .catch(DEFAULT_PAGE_SIZE);

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
  pageSize: pageSizeSchema,
  q: querySchema,
  member: memberSchema,
});
