import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { BillingProvider } from "@/features/billing/client";
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

  const space = await helpers.spaces.getCurrent.fetch();

  if (!space) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/setup", returnUrl: pathname }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SpaceProvider>
        <BillingProvider>{children}</BillingProvider>
      </SpaceProvider>
    </HydrationBoundary>
  );
}
