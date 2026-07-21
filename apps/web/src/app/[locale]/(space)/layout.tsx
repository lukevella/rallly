import { SessionRefresher } from "@/components/session-refresher";
import { PayWall } from "@/features/billing/components/pay-wall";
import { SpaceProvider } from "@/features/space/client";
import { getActiveSpace } from "@/features/space/loaders";
import { UserProvider } from "@/features/user/client";
import { TimeZoneMismatchDialog } from "@/features/user/components/timezone-mismatch-dialog";
import { getLocale } from "@/i18n/server/get-locale";
import { getSession } from "@/lib/auth";
import { DateTimeProvider } from "@/lib/datetime/client";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, session, space] = await Promise.all([
    getLocale(),
    getSession(),
    getActiveSpace(),
  ]);

  const user = session?.user;

  return (
    <>
      <SessionRefresher />
      <TimeZoneMismatchDialog homeTimeZone={user?.timeZone} />
      <UserProvider user={user ?? null}>
        <DateTimeProvider
          locale={locale}
          timeZone={user?.timeZone}
          timeFormat={user?.timeFormat}
          weekStart={user?.weekStart}
        >
          <SpaceProvider space={space}>
            {children}
            <PayWall />
          </SpaceProvider>
        </DateTimeProvider>
      </UserProvider>
    </>
  );
}
