import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupFooter } from "@/app/[locale]/setup/components/setup-footer";
import { SetupForm } from "@/app/[locale]/setup/components/setup-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Logo } from "@/features/branding/components/logo";
import { getOwnedSpace } from "@/features/space/data";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import { validateRedirectUrl } from "@/lib/utils/redirect";

export default async function SetupPage(props: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  // Whether onboarding is done is "does a space exist", not "is one
  // active": getActiveSpaceForUser hides memberships in hobby spaces the
  // user doesn't own, so gating on it sent established accounts back here
  // and had them create a second space.
  const space = await getOwnedSpace(user.id);

  // Mirrors the gate in features/space/loaders.ts: name and a space are
  // required, timezone and time format are not. The two conditions have to
  // agree or the user ping-pongs between here and the app.
  if (user.name && space) {
    redirect(validateRedirectUrl(searchParams?.redirectTo) ?? "/");
  }

  // Prefill from the device: the timeZone cookie tracks the browser's zone
  // on every visit, and the format cookie holds a per-device choice.
  const device = await getDeviceDateTimeConfig();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3">
        <Logo size="sm" />
        <ThemeSwitcher />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 overflow-y-auto p-4"
      >
        <article className="m-auto w-full max-w-sm space-y-8">
          <header>
            <h1 className="font-bold text-2xl">
              <Trans
                i18nKey="setupAccountTitle"
                defaults="Set Up Your Account"
              />
            </h1>
            <p className="mt-1 text-muted-foreground">
              <Trans
                i18nKey="setupAccountDescription"
                defaults="Tell us a bit about yourself."
              />
            </p>
          </header>
          <div>
            <SetupForm
              defaultName={user.name}
              defaultTimeZone={user.timeZone ?? device.timeZone}
              defaultTimeFormat={user.timeFormat ?? device.timeFormat}
            />
          </div>
        </article>
      </main>
      <footer className="flex justify-center p-16">
        <SetupFooter email={user.email} />
      </footer>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("setupAccountTitle", {
      defaultValue: "Set Up Your Account",
    }),
  };
}
