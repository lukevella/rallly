import zxcvbn from "zxcvbn";
import { temporaryEmailDomains } from "@/features/auth/constants";
import type { PasswordQuality } from "@/features/auth/types";

/**
 * Calculate password strength using zxcvbn
 * @returns Score from 0-4:
 * - 0: too guessable (very weak)
 * - 1: very guessable (weak)
 * - 2: somewhat guessable (fair)
 * - 3: safely unguessable (good)
 * - 4: very unguessable (strong)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  const result = zxcvbn(password);
  return result.score;
}

export function getPasswordQuality(password: string): PasswordQuality {
  const score = calculatePasswordStrength(password);
  switch (score) {
    case 0:
      return "veryWeak";
    case 1:
      return "weak";
    case 2:
      return "fair";
    case 3:
      return "good";
    case 4:
      return "strong";
    default:
      return "veryWeak";
  }
}

export const passwordQualityThresholds: Record<PasswordQuality, number> = {
  veryWeak: 0,
  weak: 1,
  fair: 2,
  good: 3,
  strong: 4,
};

export function isEmailBlocked(email: string) {
  if (process.env.ALLOWED_EMAILS) {
    const allowedEmails = process.env.ALLOWED_EMAILS.split(",")
      .map((allowedEmail) => allowedEmail.trim())
      .filter(Boolean);
    // Check whether the email matches enough of the patterns specified in ALLOWED_EMAILS
    const isAllowed = allowedEmails.some((allowedEmail) => {
      const regex = new RegExp(
        `^${allowedEmail
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replaceAll(/[*]/g, ".*")}$`,
        "i",
      );
      return regex.test(email);
    });

    if (!isAllowed) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if an email domain is a known temporary/disposable email service
 */
export const isTemporaryEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return temporaryEmailDomains.includes(domain);
};
