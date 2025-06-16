import { pollStatusSchema } from "@/features/poll/schema";
import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 10;

export const pageSchema = z.coerce.number().optional().default(1);

export const querySchema = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

export const statusSchema = pollStatusSchema
  .optional()
  .catch("live")
  .default("live");

export const pageSizeSchema = z.coerce
  .number()
  .optional()
  .transform((val) => {
    if (!val) return DEFAULT_PAGE_SIZE;
    return Number.isNaN(val) || val < 1
      ? DEFAULT_PAGE_SIZE
      : Math.min(val, 100);
  });

export const searchParamsSchema = z.object({
  status: statusSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
  q: querySchema,
});
