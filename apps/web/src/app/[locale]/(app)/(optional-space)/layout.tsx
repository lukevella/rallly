import { BillingProvider } from "@/features/billing/client";
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

  await helpers.billing.getTier.prefetch();

  return <BillingProvider>{children}</BillingProvider>;
}
