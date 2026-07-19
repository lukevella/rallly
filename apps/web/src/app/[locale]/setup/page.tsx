import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/features/branding/components/logo";
import { SetupForm } from "@/features/setup/components/setup-form";
import { getActiveSpaceForUser } from "@/features/space/data";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import { validateRedirectUrl } from "@/lib/utils/redirect";

export default async function SetupPage(props: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const space = await getActiveSpaceForUser(user.id);

  if (user.name && user.timeZone && user.timeFormat && space) {
    redirect(validateRedirectUrl(searchParams?.redirectTo) ?? "/");
  }

  // Prefill from the device: the timeZone cookie tracks the browser's zone
  // on every visit, and the format cookie holds a per-device choice.
  const device = await getDeviceDateTimeConfig();

  return (
    <div className="flex min-h-dvh justify-center bg-background p-4 sm:items-center">
      <main id="main-content" tabIndex={-1} className="w-full max-w-sm">
        <article className="space-y-8">
          <div className="flex justify-center py-8">
            <Logo />
          </div>
          <header className="text-center">
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
