import { avatarAssetProfile } from "@/features/user/constants";
import { parseAssetKey } from "@/lib/storage/asset-profile";

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

/**
 * Whether a stored image value is an avatar object this user uploaded. The
 * image column is writable by its owner, so it proves nothing about who owns
 * the object it names: anything that deletes by it checks this first.
 */
export const isOwnAvatarKey = ({
  key,
  userId,
}: {
  key: string;
  userId: string;
}) => parseAssetKey(key, [avatarAssetProfile])?.entityId === userId;

// The id token was verified when the provider signed the user in and is
// refreshed on every sign in, so its claims are read here without checking
// the signature again. Microsoft omits `email` for some accounts and carries
// the address in `preferred_username` instead.
export const getIdTokenEmail = (idToken: string | null) => {
  const payload = idToken?.split(".")[1];
  if (!payload) {
    return null;
  }

  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof claims !== "object" || claims === null) {
      return null;
    }
    const { email, preferred_username } = claims as Record<string, unknown>;
    if (typeof email === "string" && email.includes("@")) {
      return email;
    }
    if (
      typeof preferred_username === "string" &&
      preferred_username.includes("@")
    ) {
      return preferred_username;
    }
    return null;
  } catch {
    return null;
  }
};
