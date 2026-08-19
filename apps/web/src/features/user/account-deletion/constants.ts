export const ACCOUNT_DELETION_GRACE_DAYS = 7;

// Better-Auth's email-OTP plugin has no "delete account" type, so deletion
// reuses "email-verification" and consumes the record on success.
export const DELETE_ACCOUNT_OTP_TYPE = "email-verification" as const;
