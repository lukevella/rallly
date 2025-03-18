import React from "react";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";

import { SettingsMenu } from "./settings-menu";

export default async function ProfileLayout({
  children,
  params,
}: React.PropsWithChildren<{
  params: { locale: string };
}>) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>{t("settings")}</PageTitle>
      </PageHeader>
      <PageContent>
        <div>
          <div className="scrollbar-none -mx-3 mb-6 overflow-auto px-3 sm:mx-0 sm:px-0">
            <SettingsMenu />
          </div>
          <div>{children}</div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
