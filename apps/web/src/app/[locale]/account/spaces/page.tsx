import type { Metadata } from "next";

import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
  PageTitle,
} from "@/app/components/page-layout";
import { requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
import { loadSpaces } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { SpacesList } from "./components/spaces-list";

export default async function Page() {
  const [spaces, user] = await Promise.all([loadSpaces(), requireUser()]);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="spaces" defaults="Spaces" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <PageSectionGroup>
          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="mySpaces" defaults="My Spaces" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="spacesDescription"
                  defaults="Manage the spaces you belong to"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <SpacesList spaces={spaces} currentUserId={user.id} />
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </PageContent>
    </PageContainer>
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
