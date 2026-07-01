import * as z from "zod";

export const timeFormatSchema = z.enum(["hours12", "hours24"]);

// Coerces a cookie string ("0".."6") into a numeric weekday index.
export const weekStartSchema = z.coerce.number().int().min(0).max(6);
