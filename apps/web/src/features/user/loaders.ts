import "server-only";

import { subject } from "@casl/ability";
import { redirect } from "next/navigation";
import { cache } from "react";
import { defineAbilityFor } from "@/features/user/ability";
import { getUser, getUserHasNoAccounts, getUsers } from "@/features/user/data";
import type {
  InactivityPeriod,
  UserDTO,
  UserRole,
  UserSort,
} from "@/features/user/schema";
import { getSession, getSessionState } from "@/lib/auth";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";

/**
 * The current signed-in user, fetched from the database. Returns null
 * when there is no session or the user is a guest — the caller decides
 * how to respond (redirect, 401, etc.). Throws InvalidSessionError when
 * the session references a user that no longer exists or is banned.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return null;
  }

  const user = await getUser(session.user.id);

  if (!user || user.banned) {
    throw new InvalidSessionError();
  }

  return user;
});

/**
 * Gate for server pages that require a logged-in (non-guest) user.
 * Trusts the session cookie cache (no database read). Redirects to /login
 * when unauthenticated, fails the render on an unreadable session so a
 * transient session-store failure can't feed a / ↔ /login redirect loop.
 * Use getCurrentUser where the user is optional or must be read from the
 * database (mutation gates, stale-role-sensitive pages).
 */
export const requireUser = cache(async (): Promise<UserDTO> => {
  const state = await getSessionState();

  if (state.status === "error") {
    throw new Error("Failed to read session");
  }

  const user =
    state.status === "authenticated" ? state.session.user : undefined;

  if (!user || user.isGuest) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/login", returnUrl: pathname }),
    );
  }

  if (user.banned) {
    throw new InvalidSessionError();
  }

  return user;
});

/**
 * Gate for server pages that require an admin user. Authorized against
 * the database — the session cookie cache can hold a stale role.
 * Redirects to /login when unauthenticated and to /admin-setup for
 * everyone else — that page either offers the initial admin promotion
 * or explains that administrator access is missing.
 */
export const requireAdmin = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/login", returnUrl: pathname }),
    );
  }

  if (user.role !== "admin") {
    redirect("/admin-setup");
  }

  return user;
});

/**
 * Whether the signed-in user has no auth accounts (no password, no OAuth
 * link) — OTP-only accounts that should be nudged to set up a password.
 */
export const loadUserHasNoAccounts = cache(async () => {
  const user = await requireUser();
  return getUserHasNoAccounts(user.id);
});

/**
 * The control panel user directory, with each row annotated with what the
 * signed-in admin is allowed to do to it. Admin-gated.
 *
 * Not wrapped in cache(): the filter arguments arrive as an object literal, so
 * a memo keyed on argument identity could never hit. The page renders this
 * once per request.
 */
export async function loadUsers({
  page,
  pageSize,
  q,
  role,
  inactiveFor,
  sort,
}: {
  page: number;
  pageSize: number;
  q?: string;
  role?: UserRole;
  inactiveFor?: InactivityPeriod;
  sort: UserSort;
}) {
  const admin = await requireAdmin();

  const { users, totalUsers } = await getUsers({
    page,
    pageSize,
    q,
    role,
    inactiveFor,
    sort,
  });

  const ability = defineAbilityFor({ role: admin.role, id: admin.id });

  return {
    users: users.map((user) => ({
      ...user,
      image: user.image ?? undefined,
      canChangeRole: ability.can("update", subject("User", user), "role"),
      canBan: ability.can("update", subject("User", user), "banned"),
      canDelete: ability.can("delete", subject("User", user)),
    })),
    totalUsers,
  };
}
