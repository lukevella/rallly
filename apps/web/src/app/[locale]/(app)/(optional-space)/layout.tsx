import { BillingProvider } from "@/features/billing/client";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BillingProvider>{children}</BillingProvider>;
}
