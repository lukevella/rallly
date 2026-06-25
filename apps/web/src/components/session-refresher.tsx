import { getSession } from "@/lib/auth";
import { SessionKeepAlive } from "./session-keep-alive";

// Keeps an existing session (guest OR authenticated) alive while the user is
// active. Gated on getSession — which reads the cookie cache — so truly
// anonymous viewers with no session never mount the client keep-alive and
// never trigger a /get-session request. Safe to mount on public layouts.
export async function SessionRefresher() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return <SessionKeepAlive />;
}
