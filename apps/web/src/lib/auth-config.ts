// Session length, shared so the auth config and any window derived from it
// (e.g. the orphaned-guest cleanup) can't drift. The cleanup window must
// stay >= this value or its liveness guarantee breaks.
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days
