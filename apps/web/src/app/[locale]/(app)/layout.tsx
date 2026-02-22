import type React from "react";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { requireUser } from "@/auth/data";
import { UserProvider } from "@/components/user-provider";
import { PreferencesProvider } from "@/contexts/preferences";
import type { UserDTO } from "@/features/user/schema";
import { getSession } from "@/lib/auth";
import { TimezoneProvider } from "@/lib/timezone/client/context";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

async function loadUser() {
  const session = await getSession();

  if (!session?.user) return null;

  if (!session.user.isGuest) {
    return await requireUser();
  }

  return {
    id: session.user.id,
    name: "Guest",
    isGuest: true,
    email: `${session.user.id}@rallly.co`,
    role: "user",
    locale: session.user.locale ?? undefined,
    timeZone: session.user.timeZone ?? undefined,
    timeFormat: session.user.timeFormat ?? undefined,
    weekStart: session.user.weekStart ?? undefined,
  } satisfies UserDTO;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await loadUser();

  return (
    <UserProvider user={user ?? undefined}>
      <PreferencesProvider
        initialValue={{
          timeFormat: user?.timeFormat,
          timeZone: user?.timeZone,
          weekStart: user?.weekStart,
        }}
      >
        <TimezoneProvider initialTimezone={user?.timeZone}>
          <ConnectedDayjsProvider>
            {children}
            <TimeZoneChangeDetector />
          </ConnectedDayjsProvider>
        </TimezoneProvider>
      </PreferencesProvider>
    </UserProvider>
  );
}
