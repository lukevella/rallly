import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { BillingProvider } from "@/features/billing/client";
import { SpaceProvider } from "@/features/space/client";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  const space = await helpers.space.getCurrent.fetch();

  if (!space) {
    redirect("/setup");
  }

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SpaceProvider>
        <BillingProvider>{children}</BillingProvider>
      </SpaceProvider>
    </HydrationBoundary>
  );
}
