// Flagged verdicts a user may collect in one window before the account is
// banned. Flags are rare and every one in the last 90 days was phishing, so
// a repeat is a scammer rewording, not a false positive.
export const MODERATION_STRIKES_BEFORE_BAN = 3;
export const MODERATION_STRIKE_WINDOW = "24 h";
