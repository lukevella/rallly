import { subject } from "@casl/ability";
import { Alert, AlertTitle } from "@rallly/ui/alert";
import { ShieldXIcon } from "lucide-react";
import type { Metadata } from "next";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { requireSpace, requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getTranslation } from "@/i18n/server";
import { DeleteSpaceButton } from "./components/delete-space-button";
import { LeaveSpaceButton } from "./components/leave-space-button";
import { SpaceSettingsForm } from "./components/space-settings-form";

export default async function GeneralSettingsPage() {
  const [space, user] = await Promise.all([requireSpace(), requireUser()]);
  const ability = defineAbilityForMember({ space, user });
  const isAdmin = space.role === "admin";
  const canDeleteSpace = ability.can("delete", subject("Space", { ...space }));

  return (
    <PageSectionGroup>
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
          <SpaceSettingsForm space={space} disabled={!isAdmin} />
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="leaveSpace" defaults="Leave Space" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="leaveSpaceDescription"
              defaults="Remove yourself from this space. You'll lose access to all polls in this space."
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <LeaveSpaceButton spaceName={space.name} spaceId={space.id} />
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="deleteSpace" defaults="Delete Space" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="deleteSpaceDescription"
              defaults="Permanently delete this space and all its content. This action cannot be undone."
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          {!canDeleteSpace ? (
            <Alert>
              <ShieldXIcon />
              <AlertTitle>
                <Trans
                  i18nKey="deleteSpacePermission"
                  defaults="You need to be the owner to delete a space."
                />
              </AlertTitle>
            </Alert>
          ) : (
            <DeleteSpaceButton spaceName={space.name} spaceId={space.id} />
          )}
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
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
