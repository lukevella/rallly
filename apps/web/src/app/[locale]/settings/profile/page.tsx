import { UserIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { ProfilePage } from "@/app/[locale]/settings/profile/profile-page";
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
            <UserIcon />
          </PageIcon>
          <Trans t={t} i18nKey="profile" defaults="Profile" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <ProfilePage />
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
