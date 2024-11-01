import { HomeIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import Dashboard from "@/app/[locale]/(admin)/dashboard";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div>
      <PageContainer>
        <PageHeader>
          <div className="flex items-center gap-x-3">
            <PageIcon>
              <HomeIcon />
            </PageIcon>
            <PageTitle>
              <Trans t={t} i18nKey="home" defaults="Home" />
            </PageTitle>
          </div>
        </PageHeader>
        <PageContent>
          <Dashboard />
        </PageContent>
      </PageContainer>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
