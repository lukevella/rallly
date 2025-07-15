/**
 * Checks if a string contains contact information like URLs, email addresses, or phone numbers
 * Returns true if the string is a valid personal/company name (no contact info)
 * Returns false if the string contains contact information
 */
export function isValidName(value: string) {
  // Check for URL patterns
  // First check for common prefixes to avoid false positives with names like "Dr. Smith"
  if (/(https?:\/\/|www\.|http:|https:)/.test(value)) {
    return false;
  }

  // Common TLDs that would indicate a URL
  const commonTLDs = /\.(com|org|net|edu|gov|io|co|me|app|dev|info)(\s|$|\/)/i;
  if (commonTLDs.test(value)) {
    return false;
  }

  // Check for email patterns
  const emailPattern = /.+@.+\..+/i;
  if (emailPattern.test(value)) {
    return false;
  }

  // Check for phone number patterns (various formats)
  const phonePattern = /\+?[\d\s()\-.]{7,}/;
  if (phonePattern.test(value)) {
    return false;
  }

  return true;
}
