import { Params } from "@/app/[locale]/types";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

import { BillingPage } from "./billing-page";

export default async function Page() {
  return (
    <PageContainer>
      <PageContent>
        <BillingPage />
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("billing"),
  };
}
