import { requireSpace } from "@/auth/data";
import { BillingProvider } from "@/features/billing/client";
import { SpaceProvider } from "@/features/space/client";
import { getSession } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user && !session.user.isGuest) {
    const space = await requireSpace();
    return (
      <SpaceProvider data={space} userId={session.user.id}>
        <BillingProvider>{children}</BillingProvider>
      </SpaceProvider>
    );
  }

  return <BillingProvider>{children}</BillingProvider>;
}
