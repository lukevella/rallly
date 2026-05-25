import type { Conferencing } from "./schema";

// Returns the URI suitable for an href / ICS CONFERENCE value.
// Phone numbers are formatted as `tel:` with DTMF pause + extension if present.
export function getConferencingUri(conferencing: Conferencing): string {
  if (conferencing.provider === "phone") {
    return conferencing.extension
      ? `tel:${conferencing.number},,${conferencing.extension}`
      : `tel:${conferencing.number}`;
  }
  return conferencing.uri;
}
