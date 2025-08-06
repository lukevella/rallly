import { prisma } from "@rallly/database";
import { Icon } from "@rallly/ui/icon";
import { InfoIcon, ShieldXIcon } from "lucide-react";
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
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { DeleteSpaceButton } from "./components/delete-space-button";
import { LeaveSpaceButton } from "./components/leave-space-button";
import { SpaceSettingsForm } from "./components/space-settings-form";

export default async function GeneralSettingsPage() {
  const [space, user] = await Promise.all([requireSpace(), requireUser()]);

  const isAdmin = space.role === "admin";
  const isOwner = space.ownerId === user.id;

  if (!isAdmin) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <ShieldXIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="accessDenied" defaults="Access Denied" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="adminPermissionsRequired"
            defaults="You need admin permissions to access space settings."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  // Get additional data needed for the buttons
  const [userSpaces, pollCount, subscription] = await Promise.all([
    prisma.spaceMember.count({
      where: { userId: user.id },
    }),
    prisma.poll.count({
      where: { spaceId: space.id },
    }),
    isFeatureEnabled("billing")
      ? prisma.subscription.findUnique({
          where: { spaceId: space.id },
          select: { active: true },
        })
      : Promise.resolve(null),
  ]);

  const hasOtherSpaces = userSpaces > 1;
  const hasActiveSubscription = Boolean(subscription?.active);
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
          <SpaceSettingsForm space={space} />
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
          {isOwner ? (
            <div className="flex items-center gap-x-3 rounded-lg border p-3">
              <Icon>
                <InfoIcon />
              </Icon>
              <p className="text-sm">
                <Trans
                  i18nKey="leaveSpaceOwnerMessage"
                  defaults="You can't leave this space because you are the owner"
                />
              </p>
            </div>
          ) : !hasOtherSpaces ? (
            <div className="flex items-center gap-x-3 rounded-lg border p-3">
              <Icon>
                <InfoIcon />
              </Icon>
              <p className="text-sm">
                <Trans
                  i18nKey="leaveSpaceOnlyOneMessgae"
                  defaults="You will need to create a new space before you can leave this one."
                />
              </p>
            </div>
          ) : (
            <LeaveSpaceButton spaceName={space.name} spaceId={space.id} />
          )}
        </PageSectionContent>
      </PageSection>

      {isOwner && (
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
            {!hasOtherSpaces ? (
              <div className="flex items-center gap-x-3 rounded-lg border p-3">
                <Icon>
                  <InfoIcon />
                </Icon>
                <p className="text-sm">
                  <Trans
                    i18nKey="deleteSpaceOnlyOneMessage"
                    defaults="You need to have at least one space. Create another space before deleting this one."
                  />
                </p>
              </div>
            ) : hasActiveSubscription ? (
              <div className="flex items-center gap-x-3 rounded-lg border p-3">
                <Icon>
                  <InfoIcon />
                </Icon>
                <p className="text-sm">
                  <Trans
                    i18nKey="deleteSpaceActiveSubscriptionMessage"
                    defaults="You cannot delete this space because it has an active subscription. Please cancel your subscription first."
                  />
                </p>
              </div>
            ) : (
              <DeleteSpaceButton
                spaceName={space.name}
                spaceId={space.id}
                isOwner={isOwner}
                pollCount={pollCount}
              />
            )}
          </PageSectionContent>
        </PageSection>
      )}
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
