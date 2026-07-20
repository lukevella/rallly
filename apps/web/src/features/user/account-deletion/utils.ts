import { ACCOUNT_DELETION_GRACE_DAYS } from "./constants";

const GRACE_PERIOD_MS = ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;

export function getScheduledDeletionDate(deletedAt: Date) {
  return new Date(deletedAt.getTime() + GRACE_PERIOD_MS);
}

export function getAccountDeletionCutoff(now: Date = new Date()) {
  return new Date(now.getTime() - GRACE_PERIOD_MS);
}
