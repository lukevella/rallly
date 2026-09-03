import { PostHogInit } from "@rallly/posthog/client";
import { getSession } from "@/lib/auth";

// Lives in the root layout so every route captures, including the login,
// setup and quick-create pages that mount no UserProvider. Wraps the page
// content rather than sitting beside it: the session read streams under a
// Suspense boundary, and a sibling boundary can resolve after the page's
// own gates have hydrated and run their effects, which posthog-js silently
// drops when it has not been initialised yet. As an ancestor it always
// renders first. getSession is request-cached, so the inner gates share
// this read.
export async function PostHogSessionInit({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;

  return (
    <PostHogInit distinctId={user && !user.isGuest ? user.id : undefined}>
      {children}
    </PostHogInit>
  );
}
