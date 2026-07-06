import {
  isQuickCreateEnabled,
  QuickCreateButton,
  QuickCreateWidget,
} from "@/features/quick-create";
import { getLocale } from "@/i18n/server/get-locale";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, deviceDateTimeConfig] = await Promise.all([
    getLocale(),
    getDeviceDateTimeConfig(),
  ]);

  return (
    <DeviceDateTimeProvider
      locale={locale}
      timeZone={deviceDateTimeConfig.timeZone}
      timeFormat={deviceDateTimeConfig.timeFormat}
    >
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
        <div className="z-10 flex w-full flex-1 lg:p-4">
          <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="my-auto">
              <main
                id="main-content"
                tabIndex={-1}
                className="mx-auto w-full max-w-sm"
              >
                {children}
              </main>
            </div>
            {isQuickCreateEnabled ? (
              <div className="flex justify-center lg:hidden">
                <QuickCreateButton />
              </div>
            ) : null}
          </div>
          {isQuickCreateEnabled ? (
            <div className="relative hidden flex-1 flex-col justify-center rounded-lg border bg-muted/50 lg:flex lg:p-16">
              <div className="z-10 mx-auto w-full max-w-md">
                <QuickCreateWidget />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DeviceDateTimeProvider>
  );
}
