import * as z from "zod";
import { normalizeTimeZone } from "./utils";

export const timeFormatSchema = z.enum(["hours12", "hours24"]);

// The formatting layer's own TimeFormat; same literals as the Prisma enum so
// user records assign directly, without coupling this layer to the database.
export type TimeFormat = z.infer<typeof timeFormatSchema>;

export const timeZoneSchema = z
  .string()
  .refine((value) => normalizeTimeZone(value) !== undefined, {
    message: "Invalid IANA time zone",
  });

export const weekStartSchema = z.coerce.number().int().min(0).max(6);
