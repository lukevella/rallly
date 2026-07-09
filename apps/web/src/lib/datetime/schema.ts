import * as z from "zod";
import type { TimeFormat } from "./types";
import { normalizeTimeZone } from "./utils";

export const timeFormatSchema = z.enum([
  "hours12",
  "hours24",
]) satisfies z.ZodType<TimeFormat>;

export const timeZoneSchema = z
  .string()
  .refine((value) => normalizeTimeZone(value) !== undefined, {
    message: "Invalid IANA time zone",
  });

export const weekStartSchema = z.coerce.number().int().min(0).max(6);
