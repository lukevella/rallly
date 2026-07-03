import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { TimeZoneMismatchDialog } from "@/features/user/components/timezone-mismatch-dialog";
import { DateTimeProvider } from "@/lib/datetime/client";
import { LocaleSync } from "@/lib/locale/client";
import { getPathname } from "@/lib/pathname";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { buildSafeRedirectUrl } from "@/utils/redirect";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  const [user, space] = await Promise.all([
    helpers.user.getMe.fetch(),
    helpers.spaces.getCurrent.fetch(),
  ]);

  if (!space) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/setup", returnUrl: pathname }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SessionRefresher />
      <LocaleSync userLocale={user?.locale} />
      <TimeZoneMismatchDialog homeTimeZone={user?.timeZone} />
      <DateTimeProvider timeZone={user?.timeZone} timeFormat={user?.timeFormat}>
        <SpaceProvider>
          {children}
          <PayWall />
        </SpaceProvider>
      </DateTimeProvider>
    </HydrationBoundary>
  );
}
