"use client";

import { subject } from "@casl/ability";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { EyeIcon, LogOutIcon, TrashIcon } from "lucide-react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import {
  Setting,
  SettingControl,
  SettingDescription,
  SettingIcon,
  SettingsGroup,
  SettingTitle,
} from "@/components/setting";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { useSpace } from "@/features/space/client";
import { useAuthedUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";
import { CustomBrandingSection } from "./components/custom-branding-section";
import { DeleteSpaceButton } from "./components/delete-space-button";
import { LeaveSpaceButton } from "./components/leave-space-button";

export function GeneralSettingsPageClient() {
  const { data: space, getMemberAbility } = useSpace();
  const user = useAuthedUser();
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
          <CustomBrandingSection disabled={!isAdmin} />
          {!isOwner || canDeleteSpace ? (
            <PageSection variant="card">
              <PageSectionHeader>
                <PageSectionTitle>
                  <Trans i18nKey="dangerZone" defaults="Danger Zone" />
                </PageSectionTitle>
                <PageSectionDescription>
                  <Trans
                    i18nKey="spaceDangerZoneDescription"
                    defaults="These actions cannot be undone"
                  />
                </PageSectionDescription>
              </PageSectionHeader>
              <PageSectionContent>
                <SettingsGroup>
                  {!isOwner ? (
                    <Setting labelable={false}>
                      <SettingIcon>
                        <LogOutIcon />
                      </SettingIcon>
                      <SettingTitle>
                        <Trans i18nKey="leaveSpace" defaults="Leave Space" />
                      </SettingTitle>
                      <SettingDescription>
                        <Trans
                          i18nKey="leaveSpaceDescription"
                          defaults="Remove yourself from this space. You'll lose access to all polls in this space."
                        />
                      </SettingDescription>
                      <SettingControl labelled={false}>
                        <LeaveSpaceButton
                          spaceName={space.name}
                          spaceId={space.id}
                        />
                      </SettingControl>
                    </Setting>
                  ) : null}
                  {canDeleteSpace ? (
                    <Setting labelable={false}>
                      <SettingIcon>
                        <TrashIcon />
                      </SettingIcon>
                      <SettingTitle>
                        <Trans i18nKey="deleteSpace" defaults="Delete Space" />
                      </SettingTitle>
                      <SettingDescription>
                        <Trans
                          i18nKey="deleteSpaceDescription"
                          defaults="Permanently delete this space and all its content. This action cannot be undone."
                        />
                      </SettingDescription>
                      <SettingControl labelled={false}>
                        <DeleteSpaceButton spaceName={space.name} />
                      </SettingControl>
                    </Setting>
                  ) : null}
                </SettingsGroup>
              </PageSectionContent>
            </PageSection>
          ) : null}
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}
