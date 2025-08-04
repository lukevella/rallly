import { TabsContent } from "@rallly/ui/page-tabs";
import type { Metadata } from "next";
import {
  PageContent,
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { requireSpace } from "@/auth/data";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { SpaceSettingsForm } from "./components/space-settings-form";

export default async function GeneralSettingsPage() {
  const space = await requireSpace();

  return (
    <TabsContent value="general">
      <PageContent className="space-y-6">
        <PageSection>
          <PageSectionHeader>
            <PageSectionTitle>
              <Trans i18nKey="spaceInformation" defaults="Space Information" />
            </PageSectionTitle>
            <PageSectionDescription>
              <Trans
                i18nKey="spaceInformationDescription"
                defaults="Update your space name and basic settings."
              />
            </PageSectionDescription>
          </PageSectionHeader>
          <PageSectionContent>
            <SpaceSettingsForm space={space} />
          </PageSectionContent>
        </PageSection>
      </PageContent>
    </TabsContent>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("generalSettings", {
      defaultValue: "General Settings",
    }),
    description: t("generalSettingsDescription", {
      defaultValue:
        "Manage your space settings, including name, description, and other general preferences.",
    }),
  };
}
