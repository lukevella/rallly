import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { PreferencesProvider } from "@/contexts/preferences";
import { createPublicSSRHelper } from "@/trpc/next/ssr";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPublicSSRHelper();

  await Promise.all([
    helpers.user.getMe.prefetch(),
    helpers.billing.getTier.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <PreferencesProvider>
        <ConnectedDayjsProvider>
          {children}
          <TimeZoneChangeDetector />
        </ConnectedDayjsProvider>
      </PreferencesProvider>
    </HydrationBoundary>
  );
}
