"use client";

import { subject } from "@casl/ability";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { EyeIcon } from "lucide-react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { CustomBrandingSection } from "./components/custom-branding-section";
import { DeleteSpaceButton } from "./components/delete-space-button";
import { LeaveSpaceButton } from "./components/leave-space-button";
import { SpaceSettingsForm } from "./components/space-settings-form";

export function GeneralSettingsPageClient() {
  const { data: space, getMemberAbility } = useSpace();
  const [user] = trpc.user.getAuthed.useSuspenseQuery();
  const ability = getMemberAbility();
  const isAdmin = space.role === "admin";
  const canDeleteSpace = ability.can("delete", subject("Space", { ...space }));
  const isOwner = space.ownerId === user.id;

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="general" defaults="General" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="generalDescription"
            defaults="Change the settings of your current space"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          {!isAdmin ? (
            <Alert variant="note">
              <EyeIcon />
              <AlertDescription>
                <Trans
                  i18nKey="generalSettingsAdminRoleRequired"
                  defaults="You need to be an admin to make changes to this space."
                />
              </AlertDescription>
            </Alert>
          ) : null}
          <PageSection variant="card">
            <PageSectionContent>
              <SpaceSettingsForm space={space} disabled={!isAdmin} />
            </PageSectionContent>
          </PageSection>
          <CustomBrandingSection disabled={!isAdmin} />
          {!isOwner ? (
            <PageSection variant="card">
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
          ) : null}
          {canDeleteSpace ? (
            <PageSection variant="card">
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
                <DeleteSpaceButton spaceName={space.name} />
              </PageSectionContent>
            </PageSection>
          ) : null}
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}
