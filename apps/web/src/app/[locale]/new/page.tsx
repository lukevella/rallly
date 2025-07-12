import { Button } from "@rallly/ui/button";
import Link from "next/link";

import { PollPageIcon } from "@/app/components/page-icons";
import { CreatePoll } from "@/components/create-poll";
import { Trans } from "@/components/trans";
import { UserDropdown } from "@/components/user-dropdown";
import { getTranslation } from "@/i18n/server";
import { getLoggedIn } from "@/next-auth";

import { getInstanceSettings } from "@/features/instance-settings/queries";
import { BackButton } from "./back-button";

export default async function Page() {
  const isLoggedIn = await getLoggedIn();
  const instanceSettings = await getInstanceSettings();

  return (
    <div>
      <div className="sticky top-0 z-20 border-b bg-gray-100/90 p-3 backdrop-blur-md sm:grid-cols-3">
        <div className="mx-auto flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-4 sm:flex-1">
            <BackButton />
          </div>
          <div className="flex flex-1 sm:justify-center">
            <div className="flex items-center gap-x-3">
              <PollPageIcon size="sm" />
              <div className="flex items-baseline gap-x-8">
                <h1 className="font-semibold">
                  <Trans i18nKey="poll" defaults="Poll" />
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-1 justify-end">
            {isLoggedIn ? (
              <UserDropdown />
            ) : (
              <div className="flex items-center gap-x-2">
                <Button variant="ghost" asChild>
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent("/new")}`}
                  >
                    <Trans i18nKey="login" defaults="Login" />
                  </Link>
                </Button>
                {instanceSettings?.disableUserRegistration ? null : (
                  <Button variant="primary" asChild>
                    <Link
                      href={`/register?redirectTo=${encodeURIComponent("/new")}`}
                    >
                      <Trans i18nKey="signUp" defaults="Sign up" />
                    </Link>
                  </Button>
                )}
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
}) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
