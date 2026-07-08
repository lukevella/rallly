import * as z from "zod";

// A falsy poll timeZone means "floating". Clients historically sent "" for
// floating time polls; normalize it to null at the boundary so it can never
// be persisted. undefined must pass through untouched: in `modify` it means
// "leave the current value unchanged".
export const timeZoneInput = z
  .string()
  .transform((value) => value || null)
  .nullish();
