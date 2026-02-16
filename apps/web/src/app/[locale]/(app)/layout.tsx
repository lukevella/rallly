import type React from "react";
import type { Params } from "@/app/[locale]/types";
import { requireUser } from "@/auth/data";
import { UserProvider } from "@/components/user-provider";
import { PreferencesProvider } from "@/contexts/preferences";
import type { UserDTO } from "@/features/user/schema";
import { getSession } from "@/lib/auth";
import { LocaleSync } from "@/lib/locale/client";
import { TimezoneProvider } from "@/lib/timezone/client/context";
import { ConnectedDayjsProvider } from "@/utils/dayjs";
import { PostHogIdentify } from "../posthog-identify";
import { TimeZoneChangeDetector } from "../timezone-change-detector";

async function loadUserData() {
  const session = await getSession();

  const user = session?.user
    ? !session.user.isGuest
      ? await requireUser()
      : ({
          id: session.user.id,
          name: "Guest",
          isGuest: true,
          email: `${session.user.id}@rallly.co`,
          role: "user",
          locale: session.user.locale ?? undefined,
          timeZone: session.user.timeZone ?? undefined,
          timeFormat: session.user.timeFormat ?? undefined,
          weekStart: session.user.weekStart ?? undefined,
        } satisfies UserDTO)
    : null;

  return user;
}

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const user = await loadUserData();

  return (
    <UserProvider user={user ?? undefined}>
      <PostHogIdentify
        distinctId={user && !user.isGuest ? user.id : undefined}
      />
      <LocaleSync userLocale={user?.locale ?? locale} />
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
