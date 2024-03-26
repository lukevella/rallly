import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { PollsList } from "@/app/[locale]/(admin)/polls/polls-list";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader className="flex justify-between">
        <div className="flex items-center gap-x-2.5">
          <PageIcon>
            <BarChart2Icon />
          </PageIcon>
          <PageTitle>
            <Trans t={t} i18nKey="polls" />
          </PageTitle>
          <Button size="sm" asChild>
            <Link href="/new">
              <Icon>
                <PlusIcon />
              </Icon>
            </Link>
          </Button>
        </div>
      </PageHeader>
      <PageContent>
        <PollsList />
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
