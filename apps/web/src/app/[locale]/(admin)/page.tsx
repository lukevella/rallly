import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Squircle } from "@/app/components/squircle";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans t={t} i18nKey="home" defaults="Home" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <div className="flex flex-wrap gap-8">
          <div className="group w-full rounded-xl border bg-gray-50 p-4 shadow-sm ring-1 ring-inset ring-white/75 sm:w-96">
            <div className="mt-2 flex flex-col items-center text-center">
              <div className="relative mb-2 inline-flex size-12 items-center justify-center">
                <Squircle className="inline-flex size-10 items-center justify-center bg-purple-600 text-purple-100">
                  <BarChart2Icon className="inline-block size-6" />
                </Squircle>
              </div>
              <h2 className="text-lg font-semibold">
                <Trans t={t} i18nKey="groupPoll" defaults="Group Poll" />
              </h2>
              <p className="text-muted-foreground mt-2 text-pretty px-2.5 text-sm">
                <Trans
                  t={t}
                  i18nKey="groupPollDescription"
                  defaults="Share your availability with a group of people and find the best time to meet."
                />
              </p>
            </div>
            <div className="mt-8 grid gap-2.5">
              <Button asChild>
                <Link href="/new">
                  <Icon>
                    <PlusIcon />
                  </Icon>
                  <Trans t={t} i18nKey="create" defaults="Create" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
