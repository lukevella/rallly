"use client";

import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { InboxIcon, MessageCircleIcon } from "lucide-react";
import React from "react";
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
import { updateNotificationPreferenceAction } from "@/features/notifications/actions";
import type {
  ActivityEventType,
  NotificationPreferences,
} from "@/features/notifications/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function NotificationsPage({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences;
}) {
  const { t } = useTranslation();
  const [preferences, setPreferences] = React.useState(initialPreferences);
  const updatePreference = useSafeAction(updateNotificationPreferenceAction);

  const setPreference = async (
    eventType: ActivityEventType,
    enabled: boolean,
  ) => {
    const previous = preferences[eventType];
    setPreferences((old) => ({ ...old, [eventType]: enabled }));
    const result = await updatePreference.executeAsync({ eventType, enabled });
    if (result?.serverError || result?.validationErrors) {
      // Roll back only the toggled field — a full-snapshot restore could
      // clobber another toggle that succeeded while this one was in flight.
      setPreferences((old) => ({ ...old, [eventType]: previous }));
    } else {
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
  };

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
                    setPreference("poll.response.submitted", enabled);
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
                    setPreference("poll.comment.added", enabled);
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
