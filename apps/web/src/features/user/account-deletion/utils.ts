import {
  ACCOUNT_DELETION_GRACE_DAYS,
  DELETE_ACCOUNT_OTP_TYPE,
} from "./constants";

const GRACE_PERIOD_MS = ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;

export function getScheduledDeletionDate(deletedAt: Date) {
  return new Date(deletedAt.getTime() + GRACE_PERIOD_MS);
}

export function getAccountDeletionCutoff(now: Date = new Date()) {
  return new Date(now.getTime() - GRACE_PERIOD_MS);
}

// Mirrors toOTPIdentifier in better-auth's email-otp plugin.
export function toDeletionOTPIdentifier(email: string) {
  return `${DELETE_ACCOUNT_OTP_TYPE}-otp-${email.toLowerCase()}`;
}
