import type { LicenseType } from "../schema";

export function getSeats(type: LicenseType) {
  switch (type) {
    case "PLUS":
      return 5;
    case "ORGANIZATION":
      return 50;
  }
}
