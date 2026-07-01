import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
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
      <TimeZoneChangeDetector initialTimeZone={user?.timeZone} />
      <SpaceProvider>
        {children}
        <PayWall />
      </SpaceProvider>
    </HydrationBoundary>
  );
}
