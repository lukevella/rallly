import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { loadNotificationPreferences } from "@/features/notifications/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { NotificationsPage } from "./notifications-page";

export default async function Page() {
  const preferences = await loadNotificationPreferences();

  return (
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
        <NotificationsPage initialPreferences={preferences} />
      </SettingsPageContent>
    </SettingsPage>
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
