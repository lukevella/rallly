import { Logo } from "@/features/branding/components/logo";
import { LOGO_VIEWBOX } from "@/features/branding/constants";
import { QuickCreateButton } from "@/features/quick-create/components/quick-create-button";
import { QuickCreateWidget } from "@/features/quick-create/components/quick-create-widget";
import { isQuickCreateEnabled } from "@/features/quick-create/constants";
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
          <div className="my-auto flex flex-1 flex-col gap-12 p-6">
            <header className="flex justify-center">
              <Logo size="fit" />
            </header>
            <main
              id="main-content"
              tabIndex={-1}
              className="mx-auto w-full max-w-sm"
            >
              {children}
            </main>
            {isQuickCreateEnabled ? (
              <div className="flex justify-center lg:hidden">
                <QuickCreateButton />
              </div>
            ) : null}
            {/* empty spacer matching the header's logo slot height so the
                vertically centered content sits at the true middle of the page */}
            <footer style={{ height: LOGO_VIEWBOX.height }} />
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
