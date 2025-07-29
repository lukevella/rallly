import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { PreferencesPage } from "./preferences-page";

export default async function Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="preferences" defaults="Preferences" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <PreferencesPage />
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("preferences"),
  };
}
