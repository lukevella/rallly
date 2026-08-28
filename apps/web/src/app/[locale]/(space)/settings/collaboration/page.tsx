import type { Metadata } from "next";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { CollaborationSection } from "./components/collaboration-section";

export default function CollaborationSettingsPage() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="collaboration" defaults="Collaboration" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="collaborationDescription"
            defaults="How members work in this space"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <CollaborationSection />
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("collaboration", {
      defaultValue: "Collaboration",
    }),
    description: t("collaborationDescription", {
      defaultValue: "How members work in this space",
    }),
  };
}
