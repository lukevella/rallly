import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { isQuickCreateEnabled } from "@/features/quick-create/constants";
import { UserProvider } from "@/features/user/client";
import { getLocale } from "@/i18n/server/get-locale";
import { getSession } from "@/lib/auth";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import {
  createPrivateSSRHelper,
  createPublicSSRHelper,
} from "@/trpc/server/create-ssr-helper";

// The session and tRPC prefetch awaits sit below the Suspense boundary in
// the default export so the document shell can flush before they resolve.
async function OptionalSpaceGate({ children }: { children: React.ReactNode }) {
  const helpers = isQuickCreateEnabled
    ? await createPublicSSRHelper()
    : await createPrivateSSRHelper();

  const [locale, deviceDateTimeConfig, session] = await Promise.all([
    getLocale(),
    getDeviceDateTimeConfig(),
    getSession(),
    helpers.billing.getTier.prefetch(),
  ]);

  const user = session?.user;

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
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
          {children}
          <PayWall />
        </DeviceDateTimeProvider>
      </UserProvider>
    </HydrationBoundary>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouterLoadingIndicator />}>
      <OptionalSpaceGate>{children}</OptionalSpaceGate>
    </Suspense>
  );
}
