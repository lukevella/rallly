import { Suspense } from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { SessionRefresher } from "@/components/session-refresher";
import { TierProvider } from "@/features/billing/client";
import { PayWall } from "@/features/billing/components/pay-wall";
import { isQuickCreateEnabled } from "@/features/quick-create/constants";
import { getActiveSpaceForUser } from "@/features/space/data";
import { UserProvider } from "@/features/user/client";
import { requireUser } from "@/features/user/loaders";
import { getLocale } from "@/i18n/server/get-locale";
import { getSession } from "@/lib/auth";
import { isSelfHosted } from "@/lib/constants";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";

// The session awaits sit below the Suspense boundary in the default export
// so the document shell can flush before they resolve.
async function OptionalSpaceGate({ children }: { children: React.ReactNode }) {
  // Guests may only enter when quick create is enabled.
  if (!isQuickCreateEnabled) {
    await requireUser();
  }

  const [locale, deviceDateTimeConfig, session] = await Promise.all([
    getLocale(),
    getDeviceDateTimeConfig(),
    getSession(),
  ]);

  const user = session?.user;

  const space =
    user && !user.isGuest ? await getActiveSpaceForUser(user.id) : null;
  const tier = space?.tier ?? (isSelfHosted ? "pro" : "hobby");

  return (
    <>
      <SessionRefresher />
      <UserProvider user={user ?? null}>
        <DeviceDateTimeProvider
          locale={locale}
          timeZone={
            user?.timeZone ?? deviceDateTimeConfig.timeZone ?? undefined
          }
          timeFormat={
            user?.timeFormat ?? deviceDateTimeConfig.timeFormat ?? undefined
          }
          weekStart={user?.weekStart ?? undefined}
        >
          <TierProvider tier={tier}>
            {children}
            <PayWall />
          </TierProvider>
        </DeviceDateTimeProvider>
      </UserProvider>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouterLoadingIndicator />}>
      <OptionalSpaceGate>{children}</OptionalSpaceGate>
    </Suspense>
  );
}
