"use client";

import { Switch } from "@rallly/ui/switch";
import { InboxIcon, MessageCircleIcon } from "lucide-react";
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
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function NotificationsPage() {
  const utils = trpc.useUtils();
  const [preferences] = trpc.user.getNotificationPreferences.useSuspenseQuery();
  const updatePreference = trpc.user.updateNotificationPreference.useMutation({
    onMutate: async ({ eventType, enabled }) => {
      await utils.user.getNotificationPreferences.cancel();
      const previous = utils.user.getNotificationPreferences.getData();
      utils.user.getNotificationPreferences.setData(undefined, (old) =>
        old ? { ...old, [eventType]: enabled } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.user.getNotificationPreferences.setData(
          undefined,
          context.previous,
        );
      }
    },
  });

  return (
    <PageSectionGroup>
      <PageSection variant="card">
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="polls" defaults="Polls" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="pollNotificationsDescription"
              defaults="Get notified by email when there is activity on your polls"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <SettingsGroup>
            <Setting>
              <SettingIcon>
                <InboxIcon />
              </SettingIcon>
              <SettingTitle>
                <Trans i18nKey="notifyNewResponse" defaults="New response" />
              </SettingTitle>
              <SettingDescription>
                <Trans
                  i18nKey="notifyNewResponseDescription"
                  defaults="Receive an email when a participant submits a response."
                />
              </SettingDescription>
              <SettingControl>
                <Switch
                  checked={preferences["poll.response.submitted"]}
                  onCheckedChange={(enabled) => {
                    updatePreference.mutate({
                      eventType: "poll.response.submitted",
                      enabled,
                    });
                  }}
                />
              </SettingControl>
            </Setting>
            <Setting>
              <SettingIcon>
                <MessageCircleIcon />
              </SettingIcon>
              <SettingTitle>
                <Trans i18nKey="notifyNewComment" defaults="New comment" />
              </SettingTitle>
              <SettingDescription>
                <Trans
                  i18nKey="notifyNewCommentDescription"
                  defaults="Receive an email when someone comments on your poll."
                />
              </SettingDescription>
              <SettingControl>
                <Switch
                  checked={preferences["poll.comment.added"]}
                  onCheckedChange={(enabled) => {
                    updatePreference.mutate({
                      eventType: "poll.comment.added",
                      enabled,
                    });
                  }}
                />
              </SettingControl>
            </Setting>
          </SettingsGroup>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}
