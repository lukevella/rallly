import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/data";
import { Logo } from "@/components/logo";
import { Trans } from "@/components/trans";
import { CreateSpaceForm } from "@/features/setup/components/create-space-form";
import { userHasSpaces } from "@/features/setup/utils";
import { getTranslation } from "@/i18n/server";

export default async function SetupPage() {
  const user = await requireUser();

  if (await userHasSpaces(user.id)) {
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
              <Trans i18nKey="createSpace" defaults="Create Space" />
            </h1>
            <p className="mt-1 text-muted-foreground">
              <Trans
                i18nKey="createSpaceDescription"
                defaults="Create a space to organize your polls and events."
              />
            </p>
          </header>
          <main>
            <CreateSpaceForm />
          </main>
        </article>
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("createSpace", {
      defaultValue: "Create Space",
    }),
  };
}
