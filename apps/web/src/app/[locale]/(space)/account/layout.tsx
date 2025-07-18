import type React from "react";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";

import { SignOutButton } from "./components/sign-out-button";
import { SettingsLayout } from "./settings-menu";

export default async function ProfileLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="settings" />
          </PageTitle>
        </PageHeaderContent>
        <PageHeaderActions>
          <SignOutButton />
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        <SettingsLayout>{children}</SettingsLayout>
      </PageContent>
    </PageContainer>
  );
}
