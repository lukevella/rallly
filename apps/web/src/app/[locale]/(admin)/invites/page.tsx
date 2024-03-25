import { Icon } from "@rallly/ui/icon";
import { MailIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

import { ResponseList } from "./table";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-2.5">
          <Icon size="lg">
            <MailIcon />
          </Icon>
          <PageTitle>
            <Trans t={t} i18nKey="invites" defaults="Invites" />
          </PageTitle>
        </div>
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
