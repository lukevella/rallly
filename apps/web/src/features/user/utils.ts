export type GuestSessionResult =
  | { ok: true }
  | { ok: false; reason: "tooManyRequests" | "sessionUnavailable" };

/**
 * Maps the anonymous sign-in response to whether a session now exists. The
 * "already anonymous" refusal means a guest cookie is present (the page's
 * user context was stale), so the write can go ahead.
 */
export const toGuestSessionResult = (
  error: { status: number; code?: string } | null,
): GuestSessionResult => {
  if (
    !error ||
    error.code === "ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY"
  ) {
    return { ok: true };
  }

  if (error.status === 429) {
    return { ok: false, reason: "tooManyRequests" };
  }

  return { ok: false, reason: "sessionUnavailable" };
};
