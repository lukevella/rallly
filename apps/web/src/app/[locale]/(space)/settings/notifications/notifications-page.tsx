"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { BellIcon, InboxIcon, MessageCircleIcon } from "lucide-react";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { SettingIcon } from "@/components/setting-icon";
import { updateNotificationPreferenceAction } from "@/features/notifications/actions";
import type {
  ActivityEventType,
  NotificationChannel,
  NotificationPreferences,
} from "@/features/notifications/schema";
import { getNotificationPreferenceKey } from "@/features/notifications/schema";
import { Trans, useTranslation } from "@/i18n/client";

export function NotificationsPage({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences;
}) {
  const { t } = useTranslation();
  const [preferences, setPreferences] = React.useState(initialPreferences);
  const updatePreference = useMutation(
    mutationOptions(updateNotificationPreferenceAction),
  );

  const setPreference = async (
    eventType: ActivityEventType,
    channel: NotificationChannel,
    enabled: boolean,
  ) => {
    const key = getNotificationPreferenceKey(eventType, channel);
    const previous = preferences[key];
    setPreferences((old) => ({ ...old, [key]: enabled }));
    try {
      await updatePreference.mutateAsync({ eventType, channel, enabled });
      toast.success(t("saved", { defaultValue: "Saved" }));
    } catch {
      // Roll back only the toggled field — a full-snapshot restore could
      // clobber another toggle that succeeded while this one was in flight.
      setPreferences((old) => ({ ...old, [key]: previous }));
    }
  };

  const toggle = (
    eventType: ActivityEventType,
    channel: NotificationChannel,
  ) => (
    <Switch
      id={`notify-${channel}-${eventType}`}
      checked={preferences[getNotificationPreferenceKey(eventType, channel)]}
      onCheckedChange={(enabled) => {
        setPreference(eventType, channel, enabled);
      }}
    />
  );

  return (
    <PageSectionGroup>
      <PageSection variant="card">
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="email" defaults="Email" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="pollNotificationsDescription"
              defaults="Get notified by email when there is activity on your polls"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <FieldGroup variant="divided">
            <Field orientation="horizontal">
              <SettingIcon>
                <InboxIcon />
              </SettingIcon>
              <FieldContent>
                <FieldLabel htmlFor="notify-email-poll.response.submitted">
                  <Trans i18nKey="notifyNewResponse" defaults="New response" />
                </FieldLabel>
                <FieldDescription>
                  <Trans
                    i18nKey="notifyNewResponseDescription"
                    defaults="Receive an email when a participant submits a response."
                  />
                </FieldDescription>
              </FieldContent>
              {toggle("poll.response.submitted", "email")}
            </Field>
            <Field orientation="horizontal">
              <SettingIcon>
                <MessageCircleIcon />
              </SettingIcon>
              <FieldContent>
                <FieldLabel htmlFor="notify-email-poll.comment.added">
                  <Trans i18nKey="notifyNewComment" defaults="New comment" />
                </FieldLabel>
                <FieldDescription>
                  <Trans
                    i18nKey="notifyNewCommentDescription"
                    defaults="Receive an email when someone comments on your poll."
                  />
                </FieldDescription>
              </FieldContent>
              {toggle("poll.comment.added", "email")}
            </Field>
          </FieldGroup>
        </PageSectionContent>
      </PageSection>
      <PageSection variant="card">
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="inApp" defaults="In-app" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="inAppNotificationsDescription"
              defaults="Show activity on your polls in the notifications inbox"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <FieldGroup variant="divided">
            <Field orientation="horizontal">
              <SettingIcon>
                <BellIcon />
              </SettingIcon>
              <FieldContent>
                <FieldLabel htmlFor="notify-inApp-poll.response.submitted">
                  <Trans i18nKey="notifyNewResponse" defaults="New response" />
                </FieldLabel>
                <FieldDescription>
                  <Trans
                    i18nKey="inAppNewResponseDescription"
                    defaults="Add an entry to your inbox when a participant submits a response."
                  />
                </FieldDescription>
              </FieldContent>
              {toggle("poll.response.submitted", "inApp")}
            </Field>
            <Field orientation="horizontal">
              <SettingIcon>
                <MessageCircleIcon />
              </SettingIcon>
              <FieldContent>
                <FieldLabel htmlFor="notify-inApp-poll.comment.added">
                  <Trans i18nKey="notifyNewComment" defaults="New comment" />
                </FieldLabel>
                <FieldDescription>
                  <Trans
                    i18nKey="inAppNewCommentDescription"
                    defaults="Add an entry to your inbox when someone comments on your poll."
                  />
                </FieldDescription>
              </FieldContent>
              {toggle("poll.comment.added", "inApp")}
            </Field>
          </FieldGroup>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}
