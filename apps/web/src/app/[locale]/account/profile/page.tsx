import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { TrashIcon } from "lucide-react";
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
import { getTranslation } from "@/i18n/server";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ProfileEmailAddress } from "./profile-email-address";
import { ProfileSettings } from "./profile-settings";

export default async function Page() {
  const user = await requireUser();
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="profile" defaults="Profile" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <PageSectionGroup>
          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="profile" defaults="Profile" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="profileDescription"
                  defaults="Set your public profile information"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <ProfileSettings name={user.name} image={user.image} />
            </PageSectionContent>
          </PageSection>

          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="profileEmailAddress" defaults="Email Address" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="profileEmailAddressDescription"
                  defaults="Your email address is used to log in to your account"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <ProfileEmailAddress />
            </PageSectionContent>
          </PageSection>

          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="dangerZone" defaults="Danger Zone" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="dangerZoneAccount"
                  defaults="Delete your account permanently. This action cannot be undone."
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <DeleteAccountDialog email={user.email}>
                <DialogTrigger asChild>
                  <Button className="text-destructive">
                    <TrashIcon className="size-4" />
                    <Trans i18nKey="deleteAccount" defaults="Delete Account" />
                  </Button>
                </DialogTrigger>
              </DeleteAccountDialog>
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
    title: t("profile"),
  };
}
