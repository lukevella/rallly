import { Settings2Icon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { PreferencesPage } from "@/app/[locale]/settings/preferences/preferences-page";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon>
            <Settings2Icon />
          </PageIcon>
          <Trans t={t} i18nKey="preferences" defaults="Preferences" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <PreferencesPage />
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("preferences"),
  };
}
