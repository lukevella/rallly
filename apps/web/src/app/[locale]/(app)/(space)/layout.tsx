import { BillingProvider } from "@/features/billing/client";
import { SpaceProvider } from "@/features/space/client";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SpaceProvider>
      <BillingProvider>{children}</BillingProvider>
    </SpaceProvider>
  );
}
