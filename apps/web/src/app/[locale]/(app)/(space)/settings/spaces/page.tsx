import type { Metadata } from "next";

import type { Params } from "@/app/[locale]/types";
import { PageSection, PageSectionGroup } from "@/app/components/page-layout";
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
import { SpacesList } from "./components/spaces-list";

export default async function Page() {
  const helpers = await createPrivateSSRHelper();
  const [user, spaces] = await Promise.all([
    helpers.user.getAuthed.fetch(),
    helpers.spaces.list.fetch(),
  ]);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="spaces" defaults="Spaces" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="spacesDescription"
            defaults="Manage the spaces you belong to"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          <PageSection>
            <SpacesList spaces={spaces} currentUserId={user.id} />
          </PageSection>
        </PageSectionGroup>
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
    title: t("spaces", { defaultValue: "Spaces" }),
  };
}
