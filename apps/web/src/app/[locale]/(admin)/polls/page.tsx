import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { PollsList } from "@/app/[locale]/(admin)/polls/polls-list";
import {
  PageContainer,
  PageContent,
  PageHeader,
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
      <PageHeader>
        <div className="flex items-center gap-x-2.5">
          <Icon size="lg">
            <BarChart2Icon />
          </Icon>
          <PageTitle>
            <Trans t={t} i18nKey="polls" />
          </PageTitle>
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
