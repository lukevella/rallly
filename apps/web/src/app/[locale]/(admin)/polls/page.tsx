import { BarChart2Icon } from "lucide-react";

import { UserPolls } from "@/app/[locale]/(admin)/polls/user-polls";
import { Params } from "@/app/[locale]/types";
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
  params: Params;
  children?: React.ReactNode;
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageIcon>
          <BarChart2Icon />
        </PageIcon>
        <PageTitle>
          {t("polls", {
            defaultValue: "Polls",
          })}
        </PageTitle>
      </PageHeader>
      <PageContent>
        <UserPolls />
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
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}
