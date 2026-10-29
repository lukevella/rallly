import * as z from "zod";
import { pollStatusSchema } from "@/features/poll/schema";

export const DEFAULT_PAGE_SIZE = 50;

export const pageSchema = z.coerce.number().int().min(1).catch(1);

export const querySchema = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

export const statusSchema = pollStatusSchema
  .optional()
  .catch("open")
  .default("open");

export const pageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .transform((val) => Math.min(val, 100))
  .catch(DEFAULT_PAGE_SIZE);

export const memberSchema = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

export const searchParamsSchema = z.object({
  status: statusSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
  q: querySchema,
  member: memberSchema,
});
