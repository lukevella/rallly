import { requireSpace } from "@/auth/data";
import { SpaceProvider } from "@/features/space/client";
import { auth } from "@/next-auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user && !session.user.isGuest) {
    const space = await requireSpace();
    return (
      <SpaceProvider data={space} userId={session.user.id}>
        {children}
      </SpaceProvider>
    );
  }

  return children;
}
