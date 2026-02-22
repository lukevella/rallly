import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { UserSync } from "@/components/user-provider";
import { PreferencesProvider } from "@/contexts/preferences";
import { createAuthenticatedSSRHelper } from "@/trpc/server/create-ssr-helper";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createAuthenticatedSSRHelper();

  await helpers.user.getMe.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <PreferencesProvider>
        <ConnectedDayjsProvider>
          <UserSync />
          {children}
          <TimeZoneChangeDetector />
        </ConnectedDayjsProvider>
      </PreferencesProvider>
    </HydrationBoundary>
  );
}
