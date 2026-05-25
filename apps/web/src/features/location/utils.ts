import type { Location } from "./schema";

export function formatLocationText(location: Location): string {
  return location.address;
}
