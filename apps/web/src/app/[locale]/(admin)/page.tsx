import { Trans } from "react-i18next/TransWithoutContext";

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
        <div className="flex items-center gap-x-3">
          <PageTitle>
            <Trans t={t} i18nKey="home" defaults="Home" />
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent className="space-y-6"></PageContent>
    </PageContainer>
  );
}
