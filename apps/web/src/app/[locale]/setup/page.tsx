import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilePicture } from "@/app/[locale]/(space)/account/profile/profile-picture";
import { Logo } from "@/components/logo";
import { Trans } from "@/components/trans";
import { loadUserAbility } from "@/data/user";
import { SetupForm } from "@/features/setup/components/setup-form";
import { onboardedUserSchema } from "@/features/setup/schema";
import { getTranslation } from "@/i18n/server";

export default async function SetupPage() {
  const { user } = await loadUserAbility();

  const isUserOnboarded = onboardedUserSchema.safeParse(user).success;

  if (isUserOnboarded) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh justify-center bg-background p-4 sm:items-center">
      <div className="w-full max-w-sm">
        <article className="space-y-8 lg:space-y-10">
          <div className="py-8">
            <Logo className="mx-auto" />
          </div>
          <header className="text-center">
            <h1 className="font-bold text-2xl">
              <Trans i18nKey="setupFormTitle" defaults="Setup" />
            </h1>
            <p className="mt-1 text-muted-foreground">
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("setupFormTitle", {
      defaultValue: "Setup",
    }),
  };
}
