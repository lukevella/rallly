import { Button } from "@rallly/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

import { redirect } from "next/navigation";
import { PollPageIcon } from "@/app/components/page-icons";
import { getCurrentUser } from "@/auth/data";
import { CreatePoll } from "@/components/create-poll";
import { Trans } from "@/components/trans";
import { UserDropdown } from "@/components/user-dropdown";
import { isQuickCreateEnabled } from "@/features/quick-create";
import { getTranslation } from "@/i18n/server";
import { getRegistrationEnabled } from "@/utils/get-registration-enabled";
import { BackButton } from "./back-button";

export default async function Page() {
  const [user, isRegistrationEnabled] = await Promise.all([
    getCurrentUser(),
    getRegistrationEnabled(),
  ]);

  if (!user && !isQuickCreateEnabled) {
    redirect(`/login?redirectTo=${encodeURIComponent("/new")}`);
  }

  return (
    <div className="absolute inset-0 h-dvh overflow-auto bg-gray-100 dark:bg-gray-900">
      <div className="sticky top-0 z-20 border-b bg-gray-100/90 p-3 backdrop-blur-md sm:grid-cols-3 dark:bg-gray-900/90">
        <div className="mx-auto flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-4 sm:flex-1">
            <BackButton />
          </div>
          <div className="flex flex-1 sm:justify-center">
            <div className="flex items-center gap-x-2">
              <PollPageIcon size="xs" />
              <div className="flex items-baseline gap-x-8">
                <h1 className="font-semibold">
                  <Trans i18nKey="poll" defaults="Poll" />
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-1 justify-end">
            {user ? (
              <UserDropdown
                name={user.name}
                image={user.image ?? undefined}
                email={user.email ?? undefined}
              />
            ) : (
              <div className="flex items-center gap-x-2">
                <Button variant="ghost" asChild>
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent("/new")}`}
                  >
                    <Trans i18nKey="login" defaults="Login" />
                  </Link>
                </Button>
                {isRegistrationEnabled ? (
                  <Button variant="primary" asChild>
                    <Link
                      href={`/register?redirectTo=${encodeURIComponent("/new")}`}
                    >
                      <Trans i18nKey="signUp" defaults="Sign up" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl p-3 sm:px-6 sm:py-5">
        <CreatePoll />
      </div>
    </div>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
