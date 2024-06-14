import { Trans } from "react-i18next/TransWithoutContext";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { BackButton } from "@/app/[locale]/(admin)/menu/menu-button";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";
import { UserDropdown } from "@/components/user-dropdown";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-gray-100/90 p-3 backdrop-blur-md sm:grid-cols-3">
        <div className="flex items-center justify-center gap-x-4">
          <BackButton />
          <GroupPollIcon size="xs" />
          <div className="flex items-baseline gap-x-8">
            <h1 className="text-sm font-semibold">
              <Trans t={t} i18nKey="groupPoll" defaults="Group Poll" />
            </h1>
          </div>
        </div>
        <div className="flex justify-end">
          <UserDropdown />
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
