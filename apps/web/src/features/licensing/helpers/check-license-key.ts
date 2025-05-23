import { calculateChecksum } from "./calculate-checksum";

export function checkLicenseKey(key: string): boolean {
  const parts = key.split("-");
  if (parts.length !== 6) return false;
  const checksum = parts[5];
  const licenseBody = parts.slice(0, 5).join("-");
  return calculateChecksum(licenseBody) === checksum;
}
