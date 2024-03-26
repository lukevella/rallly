import { CreditCardIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { BillingPage } from "@/app/[locale]/settings/billing/billing-page";
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
            <CreditCardIcon />
          </PageIcon>
          <Trans t={t} i18nKey="billing" defaults="Billing" />
        </PageTitle>
      </PageHeader>
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
