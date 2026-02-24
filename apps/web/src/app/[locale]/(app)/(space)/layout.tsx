import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
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
    const headersList = await headers();
    const pathname = headersList.get("x-pathname");
    const searchParams = new URLSearchParams();
    if (pathname) {
      searchParams.set("redirectTo", pathname);
    }
    redirect(`/setup?${searchParams.toString()}`);
  }

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SpaceProvider>
        <BillingProvider>{children}</BillingProvider>
      </SpaceProvider>
    </HydrationBoundary>
  );
}
