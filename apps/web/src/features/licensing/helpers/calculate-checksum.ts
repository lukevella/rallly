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
