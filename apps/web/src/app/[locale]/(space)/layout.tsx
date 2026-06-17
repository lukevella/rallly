import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { SessionRefresher } from "@/components/session-refresher";
import { PreferencesProvider } from "@/contexts/preferences";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { getPathname } from "@/lib/pathname";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { buildSafeRedirectUrl } from "@/utils/redirect";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  await Promise.all([helpers.user.getMe.prefetch()]);

  const space = await helpers.spaces.getCurrent.fetch();

  if (!space) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/setup", returnUrl: pathname }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SessionRefresher />
      <PreferencesProvider>
        <SpaceProvider>
          {children}
          <PayWall />
        </SpaceProvider>
      </PreferencesProvider>
    </HydrationBoundary>
  );
}
