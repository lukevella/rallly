import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { SettingsTabs } from "./components/settings-tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="settings" defaults="Settings" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <SettingsTabs>{children}</SettingsTabs>
      </PageContent>
    </PageContainer>
  );
}
