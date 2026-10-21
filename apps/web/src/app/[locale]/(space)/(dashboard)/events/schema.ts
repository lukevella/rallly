import * as z from "zod";
import { statusSchema } from "@/features/scheduled-event/schema";

export const DEFAULT_PAGE_SIZE = 50;

export const pageSchema = z.coerce.number().int().min(1).catch(1);

export const pageSizeSchema = z.coerce
  .number()
  .optional()
  .transform((val) => {
    if (!val) return DEFAULT_PAGE_SIZE;
    return Number.isNaN(val) || val < 1
      ? DEFAULT_PAGE_SIZE
      : Math.min(val, 100);
  });

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
