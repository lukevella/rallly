import { Trans } from "react-i18next/TransWithoutContext";

import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { CommandMenu } from "@/components/command-menu";
import { getTranslation } from "@/i18n/server";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-3">
          <PageTitle>
            <Trans t={t} i18nKey="search" defaults="Search" />
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent className="space-y-6">
        <CommandMenu />
      </PageContent>
    </PageContainer>
  );
}
