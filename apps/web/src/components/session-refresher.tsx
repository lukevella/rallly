import { getSession } from "@/lib/auth";
import { SessionKeepAlive } from "./session-keep-alive";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Keeps an existing session (guest OR authenticated) alive while the user is
// active. Gated on getSession — which reads the cookie cache — so truly
// anonymous viewers with no session never mount the client keep-alive and
// never trigger a /get-session request. Safe to mount on public layouts.
//
// SessionKeepAlive only mounts once the session is at least a day old, matching
// better-auth's `updateAge` of one day: refreshing more often would just fire
// /get-session requests that can't advance the sliding expiry anyway.
export async function SessionRefresher() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const age = Date.now() - new Date(session.updatedAt).getTime();

  if (age < ONE_DAY_MS) {
    return null;
  }

  return <SessionKeepAlive />;
}
