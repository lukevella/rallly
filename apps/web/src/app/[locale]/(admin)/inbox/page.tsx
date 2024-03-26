import { InboxIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

import { ResponseList } from "./table";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon>
            <InboxIcon />
          </PageIcon>
          <Trans t={t} i18nKey="inbox" defaults="Inbox" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <ResponseList />
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
    title: t("invites"),
  };
}
