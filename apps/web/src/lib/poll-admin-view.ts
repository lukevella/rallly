import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * The opt in to the new poll admin. Present means the host chose it; absent
 * means the legacy admin, which is everyone's default. Per browser while the
 * new admin is in beta.
 */
export const POLL_ADMIN_VIEW_COOKIE = "rallly-poll-admin-view";
export const POLL_ADMIN_VIEW_NEW = "new";

// The legacy admin's page itself, not its edit routes, which have no
// counterpart yet
const LEGACY_ADMIN_PATH = /^\/poll\/([^/]+)\/?$/;

/**
 * Sends a host who opted in from the legacy admin to the new one. A redirect,
 * not a rewrite: the new admin has its own URLs (its Results tab included),
 * so the address bar has to match the page.
 */
export function redirectToNewPollAdmin(req: NextRequest) {
  if (req.method !== "GET") return null;
  if (req.cookies.get(POLL_ADMIN_VIEW_COOKIE)?.value !== POLL_ADMIN_VIEW_NEW) {
    return null;
  }
  const match = LEGACY_ADMIN_PATH.exec(req.nextUrl.pathname);
  if (!match) return null;
  const url = req.nextUrl.clone();
  url.pathname = `/polls/${match[1]}`;
  return NextResponse.redirect(url);
}
