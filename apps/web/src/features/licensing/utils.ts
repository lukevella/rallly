import { customAlphabet } from "nanoid";

/**
 * Calculate a checksum for a string
 * @param str The string to calculate the checksum for
 * @returns The checksum
 */
export function calculateChecksum(str: string): string {
  // Simple checksum: sum char codes, mod 100000, base36
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return (sum % 100000).toString(36).toUpperCase().padStart(5, "0");
}

export function checkLicenseKey(key: string): boolean {
  const parts = key.split("-");
  if (parts.length !== 6) return false;
  const checksum = parts[5];
  const licenseBody = parts.slice(0, 5).join("-");
  return calculateChecksum(licenseBody) === checksum;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generate = customAlphabet(alphabet, 4);

/**
 * Generate user friendly licenses
 * eg. RLYV4-ABCD-1234-ABCD-1234-XXXX
 */
export const generateLicenseKey = ({ version }: { version?: number }) => {
  let license = `RLYV${version ?? "X"}-`;
  for (let i = 0; i < 4; i++) {
    license += generate();
    if (i < 3) {
      license += "-";
    }
  }
  const checksum = calculateChecksum(license);
  return `${license}-${checksum}`;
};
