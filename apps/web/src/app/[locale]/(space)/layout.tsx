import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { TimeZoneMismatchDialog } from "@/features/user/components/timezone-mismatch-dialog";
import { UserProvider } from "@/features/user/components/user-provider";
import { getLocale } from "@/i18n/server/get-locale";
import { getSession } from "@/lib/auth";
import { DateTimeProvider } from "@/lib/datetime/client";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  const [locale, session, space] = await Promise.all([
    getLocale(),
    getSession(),
    helpers.spaces.getCurrent.fetch(),
  ]);

  const user = session?.user;

  if (!space) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/setup", returnUrl: pathname }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SessionRefresher />
      <TimeZoneMismatchDialog homeTimeZone={user?.timeZone} />
      <UserProvider user={user ?? null}>
        <DateTimeProvider
          locale={locale}
          timeZone={user?.timeZone}
          timeFormat={user?.timeFormat}
          weekStart={user?.weekStart ?? undefined}
        >
          <SpaceProvider>
            {children}
            <PayWall />
          </SpaceProvider>
        </DateTimeProvider>
      </UserProvider>
    </HydrationBoundary>
  );
}
