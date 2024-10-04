import { Trans } from "react-i18next/TransWithoutContext";

import Dashboard from "@/app/[locale]/(admin)/dashboard";
import WelcomeMessage from "@/app/[locale]/(admin)/welcome-message";
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
    <div>
      <PageContainer>
        <PageHeader className="space-y-2">
          <PageTitle>
            <Trans t={t} i18nKey="home" defaults="Home" />
          </PageTitle>
          <p className="text-muted-foreground">
            <WelcomeMessage />
          </p>
        </PageHeader>
        <PageContent>
          <Dashboard />
        </PageContent>
      </PageContainer>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("home"),
  };
}
