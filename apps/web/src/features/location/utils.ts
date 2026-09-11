import type { Location } from "./schema";

export function formatLocationText(location: Location): string {
  return location.address;
}

export function getLocationDetails(location: Location): string | undefined {
  return location.details;
}
