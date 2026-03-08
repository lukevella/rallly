import { z } from "zod";

const fixedOffsetPrefixes = ["etc/", "gmt", "utc"];

function isGeographic(timeZone: string) {
  const lower = timeZone.toLowerCase();
  return !fixedOffsetPrefixes.some((prefix) => lower.startsWith(prefix));
}

function canonicalize(timeZone: string) {
  return Intl.DateTimeFormat(undefined, { timeZone }).resolvedOptions()
    .timeZone;
}

export const timezoneSchema = z
  .string()
  .refine(
    (tz) => {
      try {
        return isGeographic(canonicalize(tz));
      } catch {
        return false;
      }
    },
    { message: "Must be a valid IANA geographic timezone" },
  )
  .transform((tz) => canonicalize(tz));
