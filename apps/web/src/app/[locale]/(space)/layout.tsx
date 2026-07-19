import { redirect } from "next/navigation";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { getActiveSpaceForUser } from "@/features/space/data";
import { TimeZoneMismatchDialog } from "@/features/user/components/timezone-mismatch-dialog";
import { UserProvider } from "@/features/user/components/user-provider";
import { getLocale } from "@/i18n/server/get-locale";
import { getSessionState } from "@/lib/auth";
import { DateTimeProvider } from "@/lib/datetime/client";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await getSessionState();

  // An unreadable session (store unreachable, transient failure) is not
  // "logged out". Redirecting to /login on it is one leg of the / ↔ /login
  // redirect loop — fail the render instead so the user gets
  // the error boundary's retry page.
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

  const [locale, space] = await Promise.all([
    getLocale(),
    getActiveSpaceForUser(user.id),
  ]);

  if (!space) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/setup", returnUrl: pathname }),
    );
  }

  return (
    <>
      <SessionRefresher />
      <TimeZoneMismatchDialog homeTimeZone={user.timeZone} />
      <UserProvider user={user}>
        <DateTimeProvider
          locale={locale}
          timeZone={user.timeZone}
          timeFormat={user.timeFormat}
          weekStart={user.weekStart}
        >
          <SpaceProvider space={space}>
            {children}
            <PayWall />
          </SpaceProvider>
        </DateTimeProvider>
      </UserProvider>
    </>
  );
}
