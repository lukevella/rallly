import * as z from "zod";
import { MAX_RESPONSE_NOTE_LENGTH } from "@/features/poll/schema";

// A falsy poll timeZone means "floating". Clients historically sent "" for
// floating time polls; normalize it to null at the boundary so it can never
// be persisted. undefined must pass through untouched: in `modify` it means
// "leave the current value unchanged".
export const timeZoneInput = z
  .string()
  .transform((value) => value || null)
  .nullish();

// Whitespace-only notes collapse to undefined so no empty string is persisted.
export const responseNoteInput = z
  .string()
  .trim()
  .max(MAX_RESPONSE_NOTE_LENGTH)
  .optional()
  .transform((value) => value || undefined);
