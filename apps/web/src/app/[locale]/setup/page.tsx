import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/features/branding/components/logo";
import { CreateSpaceForm } from "@/features/setup/components/create-space-form";
import { SetupNameForm } from "@/features/setup/components/setup-name-form";
import { userHasSpaces } from "@/features/setup/utils";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { validateRedirectUrl } from "@/lib/utils/redirect";

export default async function SetupPage(props: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const needsName = !user.name;

  if (!needsName && (await userHasSpaces(user.id))) {
    redirect(validateRedirectUrl(searchParams?.redirectTo) ?? "/");
  }

  return (
    <div className="flex min-h-dvh justify-center bg-background p-4 sm:items-center">
      <main id="main-content" tabIndex={-1} className="w-full max-w-sm">
        <article className="space-y-8">
          <div className="flex justify-center py-8">
            <Logo />
          </div>
          <header className="text-center">
            <h1 className="font-bold text-2xl">
              {needsName ? (
                <Trans i18nKey="setupNameTitle" defaults="What's your name?" />
              ) : (
                <Trans i18nKey="createSpace" defaults="Create Space" />
              )}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {needsName ? (
                <Trans
                  i18nKey="setupNameDescription"
                  defaults="Your name appears on the polls and events you create."
                />
              ) : (
                <Trans
                  i18nKey="createSpaceDescription"
                  defaults="Create a space to organize your polls and events."
                />
              )}
            </p>
          </header>
          <div>{needsName ? <SetupNameForm /> : <CreateSpaceForm />}</div>
        </article>
      </main>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("setupTitle", {
      defaultValue: "Setup",
    }),
  };
}
