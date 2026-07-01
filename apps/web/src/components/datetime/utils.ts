import type { DateInput } from "@/lib/localization/format";

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function toISO(value: DateInput) {
  return toDate(value).toISOString();
}

export function toISODate(value: DateInput) {
  return toISO(value).slice(0, 10);
}
