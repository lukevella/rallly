import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PreferencesProvider } from "@/contexts/preferences";
import { PayWall } from "@/features/billing/components/pay-wall";
import { isQuickCreateEnabled } from "@/features/quick-create";
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

  await Promise.all([
    helpers.billing.getTier.prefetch(),
    helpers.user.getMe.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <PreferencesProvider>
        {children}
        <PayWall />
      </PreferencesProvider>
    </HydrationBoundary>
  );
}
