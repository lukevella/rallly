import { Suspense } from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { SessionRefresher } from "@/components/session-refresher";
import { TierProvider } from "@/features/billing/client";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { getActiveSpace } from "@/features/space/loaders";
import { UserProvider } from "@/features/user/client";
import { TimeZoneMismatchDialog } from "@/features/user/components/timezone-mismatch-dialog";
import { getLocale } from "@/i18n/server/get-locale";
import { getSession } from "@/lib/auth";
import { DateTimeProvider } from "@/lib/datetime/client";

// The session gate awaits below this boundary so the document shell can
// flush before the session store responds; without it, every hard load of
// a space route streams nothing until getActiveSpace resolves.
async function SpaceGate({ children }: { children: React.ReactNode }) {
  const [locale, session, space] = await Promise.all([
    getLocale(),
    getSession(),
    getActiveSpace(),
  ]);

  const user = session?.user;

  return (
    <>
      <SessionRefresher />
      <TimeZoneMismatchDialog homeTimeZone={user?.timeZone} />
      <UserProvider user={user ?? null}>
        <DateTimeProvider
          locale={locale}
          timeZone={user?.timeZone}
          timeFormat={user?.timeFormat}
          weekStart={user?.weekStart}
        >
          <TierProvider tier={space.tier}>
            <SpaceProvider space={space}>
              {children}
              <PayWall />
            </SpaceProvider>
          </TierProvider>
        </DateTimeProvider>
      </UserProvider>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouterLoadingIndicator />}>
      <SpaceGate>{children}</SpaceGate>
    </Suspense>
  );
}
