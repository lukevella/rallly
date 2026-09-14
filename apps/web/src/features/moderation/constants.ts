// Flagged verdicts a user may collect in one window before the account is
// banned. Flags are rare and every one in the last 90 days was phishing, so
// a repeat is a scammer rewording, not a false positive.
export const MODERATION_STRIKES_BEFORE_BAN = 3;
export const MODERATION_STRIKE_WINDOW = "24 h";

// Model calls a user may spend in one window. Only content that trips the
// prefilter reaches the model, so this bounds the OpenAI bill for one
// account at a few cents a day. Nobody legitimate writes this many polls
// with links, emails or phone numbers in them.
export const MODERATION_AI_CALLS_PER_DAY = 50;
