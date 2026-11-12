// Flagged verdicts on distinct content a user may collect in one window
// before the account is banned. Resubmitting the same content is not a new
// strike: the model does make mistakes, and a blocked user retries.
export const MODERATION_STRIKES_BEFORE_BAN = 3;
export const MODERATION_STRIKE_WINDOW = "24 h";

// Model calls a user may spend in one window. Only content that trips the
// prefilter reaches the model, so this bounds the OpenAI bill for one
// account at a few cents a day. Nobody legitimate writes this many polls
// with links, emails or phone numbers in them.
export const MODERATION_AI_CALLS_PER_DAY = 50;

// The reason on the safe verdict returned when the model call fails.
export const MODERATION_AI_FAILURE_REASON =
  "AI moderation failed, defaulting to safe";
