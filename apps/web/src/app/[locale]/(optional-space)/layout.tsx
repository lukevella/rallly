import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SessionRefresher } from "@/components/session-refresher";
import { PreferencesProvider } from "@/contexts/preferences";
import { PayWall } from "@/features/billing/components/pay-wall";
import { isQuickCreateEnabled } from "@/features/quick-create";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import {
  createPrivateSSRHelper,
  createPublicSSRHelper,
} from "@/trpc/server/create-ssr-helper";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = isQuickCreateEnabled
    ? await createPublicSSRHelper()
    : await createPrivateSSRHelper();

  const [deviceDateTimeConfig, user] = await Promise.all([
    getDeviceDateTimeConfig(),
    helpers.user.getMe.fetch(),
    helpers.billing.getTier.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SessionRefresher />
      <PreferencesProvider>
        <DeviceDateTimeProvider
          timeZone={
            deviceDateTimeConfig.timeZone ?? user?.timeZone ?? undefined
          }
          timeFormat={
            deviceDateTimeConfig.timeFormat ?? user?.timeFormat ?? undefined
          }
          weekStart={user?.weekStart ?? undefined}
        >
          {children}
          <PayWall />
        </DeviceDateTimeProvider>
      </PreferencesProvider>
    </HydrationBoundary>
  );
}
