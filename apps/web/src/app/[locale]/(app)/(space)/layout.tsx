import { requireSpace, requireUser } from "@/auth/data";
import { BillingProvider } from "@/features/billing/client";
import { SpaceProvider } from "@/features/space/client";

async function loadData() {
  const [user, space] = await Promise.all([requireUser(), requireSpace()]);

  return {
    user,
    space,
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, space } = await loadData();

  return (
    <SpaceProvider key={space.id} data={space} userId={user.id}>
      <BillingProvider>{children}</BillingProvider>
    </SpaceProvider>
  );
}
