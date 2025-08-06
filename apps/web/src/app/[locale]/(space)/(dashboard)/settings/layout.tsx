import { notFound } from "next/navigation";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { isSpacesEnabled } from "@/features/space/constants";
import { SettingsTabs } from "./components/settings-tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSpacesEnabled) {
    return notFound();
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="spaceSettings" defaults="Space Settings" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <SettingsTabs>{children}</SettingsTabs>
      </PageContent>
    </PageContainer>
  );
}
