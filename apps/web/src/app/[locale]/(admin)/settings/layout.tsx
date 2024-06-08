import React from "react";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

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
      <PageContent className="space-y-3 sm:space-y-4">
        <div className="scrollbar-none sticky top-0 -mx-3 overflow-auto border-b bg-gray-100 p-3">
          <SettingsMenu />
        </div>
        <div>{children}</div>
      </PageContent>
    </PageContainer>
  );
}
