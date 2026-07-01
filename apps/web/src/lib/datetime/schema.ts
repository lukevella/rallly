import * as z from "zod";

export const timeFormatSchema = z.enum(["hours12", "hours24"]);

export const weekStartSchema = z.coerce.number().int().min(0).max(6);
