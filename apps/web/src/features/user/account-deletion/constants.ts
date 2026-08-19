export const ACCOUNT_DELETION_GRACE_DAYS = 7;

// Deletion codes live in their own namespace. Better-Auth's email-OTP plugin
// only accepts its own types ("sign-in", "email-verification",
// "forget-password") and derives its storage key from type + email, so
// borrowing a type would put deletion codes in the same row as login codes —
// a code minted to sign in could then delete the account.
export const ACCOUNT_DELETION_OTP_PREFIX = "delete-account-otp";
export const ACCOUNT_DELETION_OTP_TTL_MS = 15 * 60 * 1000;
export const ACCOUNT_DELETION_OTP_MAX_ATTEMPTS = 3;
