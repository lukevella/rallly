import React from "react";

import { SettingsPageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";

import { SettingsLayout } from "./settings-menu";
import { Button } from "@rallly/ui/button";
import { Trans } from "@/components/trans";
import { SignOutButton } from "./components/sign-out-button";

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
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <PageTitle>
              <SettingsPageIcon />
              {t("settings")}
            </PageTitle>
          </div>
          <div className="flex items-center gap-2">
            <SignOutButton />
          </div>
        </div>
      </PageHeader>
      <PageContent>
        <SettingsLayout>{children}</SettingsLayout>
      </PageContent>
    </PageContainer>
  );
}
