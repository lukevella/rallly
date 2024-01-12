import { CreditCardIcon, Settings2Icon, UserIcon } from "lucide-react";
import React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import { isSelfHosted } from "@/utils/constants";

import { SettingsMenu } from "./menu-item";

export default async function ProfileLayout({
  children,
  params,
}: React.PropsWithChildren<{
  params: { locale: string };
}>) {
  const { t } = await getTranslation(params.locale);
  const menuItems = [
    {
      title: t("profile"),
      href: "/settings/profile",
      icon: UserIcon,
    },
    {
      title: t("preferences"),
      href: "/settings/preferences",
      icon: Settings2Icon,
    },
  ];

  if (!isSelfHosted) {
    menuItems.push({
      title: t("billing"),
      href: "/settings/billing",
      icon: CreditCardIcon,
    });
  }

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between gap-x-4">
          <PageTitle>
            <Trans t={t} i18nKey="settings" />
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent className="space-y-6">
        <div>
          <SettingsMenu />
        </div>
        <div className="max-w-4xl">{children}</div>
      </PageContent>
    </PageContainer>
  );
}
