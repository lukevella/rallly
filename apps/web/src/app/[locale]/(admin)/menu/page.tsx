import { Trans } from "react-i18next/TransWithoutContext";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";

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
