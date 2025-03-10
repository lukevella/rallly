/**
 * Checks if a string contains contact information like URLs, email addresses, or phone numbers
 * Returns true if the string is a valid personal/company name (no contact info)
 * Returns false if the string contains contact information
 */
export function isValidName(value: string) {
  // Check for URL patterns
  const urlPattern =
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;
  if (urlPattern.test(value)) {
    return false;
  }

  // Check for email patterns
  const emailPattern = /.+@.+\..+/i;
  if (emailPattern.test(value)) {
    return false;
  }

  // Check for phone number patterns (various formats)
  const phonePattern = /\+?[\d\s\(\)\-\.]{7,}/;
  if (phonePattern.test(value)) {
    return false;
  }

  return true;
}
