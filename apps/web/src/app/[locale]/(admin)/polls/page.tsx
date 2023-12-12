import { Button } from "@rallly/ui/button";
import { PenBoxIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { PollFolders } from "@/app/[locale]/(admin)/polls/polls-folders";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page";
import { getTranslation } from "@/app/i18n";

import { PollsList } from "./polls-list";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex justify-between items-center gap-x-4">
          <PageTitle>
            <Trans t={t} i18nKey="polls" />
          </PageTitle>
          <Button asChild variant="ghost">
            <Link href="/new">
              <PenBoxIcon className="w-4 h-4" />
              <span className="hidden sm:inline">
                <Trans t={t} i18nKey="newPoll" />
              </span>
            </Link>
          </Button>
        </div>
      </PageHeader>
      <PageContent>
        <div className="space-y-6">
          <PollFolders />
          <hr />
          <PollsList />
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
    title: t("polls"),
  };
}
