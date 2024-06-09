import { Trans } from "react-i18next/TransWithoutContext";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans t={t} i18nKey="menu" defaults="Menu" />
        </PageTitle>
      </PageHeader>
      <PageContent className="px-2">
        <Sidebar />
      </PageContent>
    </PageContainer>
  );
}
