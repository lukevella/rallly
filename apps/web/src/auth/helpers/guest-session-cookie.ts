import { cookies } from "next/headers";

const GUEST_SESSION_COOKIE = "rallly-legacy-guest-id";
const COOKIE_MAX_AGE = 60 * 15; // 15 minutes - enough time for SSO flow

/**
 * Stores the legacy guest ID in a dedicated cookie before SSO redirect.
 * This preserves the guest ID so it can be used to merge guest data
 * after the user is created in the database.
 * @param guestId - The legacy guest user ID to store
 */
export async function setLegacyGuestCookie(guestId: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SESSION_COOKIE, guestId, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Retrieves the legacy guest ID from the dedicated cookie.
 * @returns The legacy guest ID if present, null otherwise
 */
export async function getLegacyGuestCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null;
}

/**
 * Clears the legacy guest ID cookie after the merge is complete.
 */
export async function clearLegacyGuestCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_SESSION_COOKIE);
}
