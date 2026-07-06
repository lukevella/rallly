import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { isQuickCreateEnabled } from "@/features/quick-create";
import { getLocale } from "@/i18n/server/get-locale";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import { LocaleSync } from "@/lib/locale/client";
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

  const [locale, deviceDateTimeConfig, user] = await Promise.all([
    getLocale(),
    getDeviceDateTimeConfig(),
    helpers.user.getMe.fetch(),
    helpers.billing.getTier.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SessionRefresher />
      <LocaleSync userLocale={user?.locale ?? undefined} />
      <DeviceDateTimeProvider
        locale={locale}
        timeZone={user?.timeZone ?? deviceDateTimeConfig.timeZone ?? undefined}
        timeFormat={
          user?.timeFormat ?? deviceDateTimeConfig.timeFormat ?? undefined
        }
        weekStart={user?.weekStart ?? undefined}
      >
        {children}
        <PayWall />
      </DeviceDateTimeProvider>
    </HydrationBoundary>
  );
}
