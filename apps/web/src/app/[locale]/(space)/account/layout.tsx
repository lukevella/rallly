import type React from "react";

import {
  PageContainer,
  PageContent,
  PageHeader,
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
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <PageTitle>
              <Trans i18nKey="settings" />
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
