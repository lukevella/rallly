import { customAlphabet } from "nanoid";
import { calculateChecksum } from "./calculate-checksum";

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
