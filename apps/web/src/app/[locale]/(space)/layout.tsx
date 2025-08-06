import { requireSpace, requireUser } from "@/auth/data";
import { SpaceProvider } from "@/features/space/client";
import { TimezoneProvider } from "@/lib/timezone/client/context";

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
    <SpaceProvider data={space} userId={user.id}>
      <TimezoneProvider initialTimezone={user.timeZone}>
        {children}
      </TimezoneProvider>
    </SpaceProvider>
  );
}
