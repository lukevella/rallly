import { redirect } from "next/navigation";

import { ProfilePicture } from "@/app/[locale]/(space)/settings/profile/profile-picture";
import { Logo } from "@/components/logo";
import { Trans } from "@/components/trans";
import { getUser } from "@/data/get-user";
import { SetupForm } from "@/features/setup/components/setup-form";
import { isUserOnboarded } from "@/features/setup/utils";
import { getTranslation } from "@/i18n/server";

export default async function SetupPage() {
  const user = await getUser();

  if (isUserOnboarded(user)) {
    // User is already onboarded, redirect to dashboard
    redirect("/");
  }

  return (
    <div className="bg-background flex min-h-dvh justify-center p-4 sm:items-center">
      <div className="w-full max-w-sm">
        <article className="space-y-8 lg:space-y-10">
          <div className="py-8">
            <Logo className="mx-auto" />
          </div>
          <header className="text-center">
            <h1 className="text-2xl font-bold">
              <Trans i18nKey="setupFormTitle" defaults="Setup" />
            </h1>
            <p className="text-muted-foreground mt-1">
              <Trans
                i18nKey="setupFormDescription"
                defaults="Finish setting up your account."
              />
            </p>
          </header>
          <main className="space-y-4">
            <ProfilePicture name={user.name} image={user.image ?? undefined} />
            <SetupForm
              defaultValues={{
                name: user.name ?? undefined,
                timeZone: user.timeZone ?? undefined,
                locale: user.locale ?? undefined,
              }}
            />
          </main>
        </article>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("setupFormTitle", {
      defaultValue: "Setup",
    }),
  };
}
