import { Params } from "@/app/[locale]/types";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

import { PreferencesPage } from "./preferences-page";

export default async function Page() {
  return (
    <PageContainer>
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
