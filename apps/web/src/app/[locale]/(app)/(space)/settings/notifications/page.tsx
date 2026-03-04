import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { NotificationsPage } from "./notifications-page";

export default async function Page() {
  const helpers = await createPrivateSSRHelper();
  await helpers.user.getNotificationPreferences.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SettingsPage>
        <SettingsPageHeader>
          <SettingsPageTitle>
            <Trans i18nKey="notifications" defaults="Notifications" />
          </SettingsPageTitle>
          <SettingsPageDescription>
            <Trans
              i18nKey="notificationsDescription"
              defaults="Choose which email notifications you receive"
            />
          </SettingsPageDescription>
        </SettingsPageHeader>
        <SettingsPageContent>
          <NotificationsPage />
        </SettingsPageContent>
      </SettingsPage>
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("notifications", { defaultValue: "Notifications" }),
  };
}
