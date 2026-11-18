import { Suspense } from "react";
import { BrandStyle } from "@/features/branding/components/brand-style";
import { loadPollDetails } from "@/features/poll/loaders";
import { getLocale } from "@/i18n/server/get-locale";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";

async function VoteFrame({
  params,
  children,
}: {
  params: Promise<{ urlId: string }>;
  children: React.ReactNode;
}) {
  const { urlId } = await params;
  const [poll, locale, deviceDateTimeConfig] = await Promise.all([
    loadPollDetails(urlId),
    getLocale(),
    getDeviceDateTimeConfig(),
  ]);

  return (
    <DeviceDateTimeProvider
      locale={locale}
      timeZone={deviceDateTimeConfig.timeZone}
      timeFormat={deviceDateTimeConfig.timeFormat}
    >
      {/* Null unless the space's branding is active. */}
      {poll?.space?.primaryColor ? (
        <BrandStyle primaryColor={poll.space.primaryColor} />
      ) : null}
      {children}
    </DeviceDateTimeProvider>
  );
}

export default function Layout({
  params,
  children,
}: {
  params: Promise<{ urlId: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-card lg:relative lg:h-dvh lg:overflow-clip lg:bg-gray-100 dark:lg:bg-gray-900 max-lg:[body:has(&)]:bg-card lg:[html.light_body:has(&)]:bg-gray-100 lg:[html:has(&)]:overflow-hidden">
      <Suspense>
        <VoteFrame params={params}>{children}</VoteFrame>
      </Suspense>
    </div>
  );
}
