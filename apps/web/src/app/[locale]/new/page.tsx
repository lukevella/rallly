import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import type { Params } from "@/app/[locale]/types";
import { PollPageIcon } from "@/app/components/page-icons";
import { CreatePoll } from "@/components/create-poll";
import { UserDropdown } from "@/components/user-dropdown";
import { getTranslation } from "@/i18n/server";
import { getLoggedIn } from "@/next-auth";

import { BackButton } from "./back-button";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  const isLoggedIn = await getLoggedIn();

  return (
    <div>
      <div className="sticky top-0 z-20 border-b bg-gray-100/90 p-3 backdrop-blur-md sm:grid-cols-3">
        <div className="mx-auto flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-4 sm:flex-1">
            <BackButton />
          </div>
          <div className="flex flex-1 sm:justify-center">
            <div className="flex items-center gap-x-2">
              <PollPageIcon />
              <div className="flex items-baseline gap-x-8">
                <h1 className="text-sm font-semibold">
                  <Trans t={t} i18nKey="poll" defaults="Poll" />
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
                    <Trans i18nKey="login" />
                  </Link>
                </Button>
                <Button variant="primary" asChild>
                  <Link
                    href={`/register?redirectTo=${encodeURIComponent("/new")}`}
                  >
                    <Trans i18nKey="signUp" defaults="Sign up" />
                  </Link>
                </Button>
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

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
