import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { getLocale } from "@/i18n/server/get-locale";
import { LocaleSync } from "@/lib/locale/client";
import { LocalizationProvider } from "@/lib/localization/context";
import { getLocaleDefaults } from "@/lib/localization/locales";
import { getPathname } from "@/lib/pathname";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { buildSafeRedirectUrl } from "@/utils/redirect";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  const [user, space, locale] = await Promise.all([
    helpers.user.getMe.fetch(),
    helpers.spaces.getCurrent.fetch(),
    getLocale(),
  ]);

  if (!space) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/setup", returnUrl: pathname }),
    );
  }

  const localeDefaults = getLocaleDefaults(locale);
  const localization = {
    locale,
    timeZone: user?.timeZone ?? undefined,
    timeFormat: user?.timeFormat ?? localeDefaults.timeFormat,
    weekStart: user?.weekStart ?? localeDefaults.weekStart,
  };

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SessionRefresher />
      <LocaleSync userLocale={user?.locale} />
      <TimeZoneChangeDetector initialTimeZone={user?.timeZone} />
      <LocalizationProvider defaults={localization}>
        <SpaceProvider>
          {children}
          <PayWall />
        </SpaceProvider>
      </LocalizationProvider>
    </HydrationBoundary>
  );
}
