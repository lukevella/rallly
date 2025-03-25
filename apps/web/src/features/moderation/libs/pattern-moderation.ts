/**
 * Checks if the provided text contains suspicious patterns that might indicate spam or abuse
 * @param text The text to check for suspicious patterns
 * @returns True if suspicious patterns are detected, false otherwise
 */
export function containsSuspiciousPatterns(text: string) {
  if (!text.trim()) return false;

  // Define all patterns
  const repetitiveCharsPattern = /(.)\1{4,}/;
  const allCapsPattern = /[A-Z]{5,}/;
  const excessiveSpecialCharsPattern =
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{4,}/;
  const suspiciousUrlPattern = /(bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd)/i;

  // Email address pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

  // Comprehensive phone number pattern covering various formats
  const phoneNumberPattern =
    /(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}|\+\d[\d\s\-\.]{5,14}|\+\d{6,15}/i;

  // Detect suspicious Unicode patterns - simplified version without surrogate pairs
  const suspiciousUnicodePattern =
    /[\u2028-\u202F\u2800-\u28FF\u3164\uFFA0\u115F\u1160\u3000\u2000-\u200F\u205F-\u206F\uFEFF]/;

  // Simple leet speak pattern that detects number-letter-number patterns
  const leetSpeakPattern = /[a-z0-9]*[0-9][a-z][0-9][a-z0-9]*/i;

  return (
    // Simple pattern checks (least intensive)
    allCapsPattern.test(text) ||
    repetitiveCharsPattern.test(text) ||
    excessiveSpecialCharsPattern.test(text) ||
    // Medium complexity patterns
    suspiciousUrlPattern.test(text) ||
    emailPattern.test(text) ||
    leetSpeakPattern.test(text) ||
    // More complex patterns
    phoneNumberPattern.test(text) ||
    // Most intensive pattern (Unicode handling)
    suspiciousUnicodePattern.test(text)
  );
}
