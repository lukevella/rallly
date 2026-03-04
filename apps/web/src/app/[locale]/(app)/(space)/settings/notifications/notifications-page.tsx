"use client";

import { Tabs, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import type { NotificationScope } from "@/features/notifications/schema";
import { notificationScopeSchema } from "@/features/notifications/schema";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

function NotificationScopeTabs({
  value,
  onValueChange,
  disabled,
}: {
  value: NotificationScope;
  onValueChange: (value: NotificationScope) => void;
  disabled?: boolean;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(notificationScopeSchema.parse(v))}
    >
      <TabsList>
        <TabsTrigger value="off" disabled={disabled}>
          <Trans i18nKey="notificationScopeOff" defaults="Off" />
        </TabsTrigger>
        <TabsTrigger value="mine" disabled={disabled}>
          <Trans i18nKey="notificationScopeMine" defaults="Mine" />
        </TabsTrigger>
        <TabsTrigger value="all" disabled={disabled}>
          <Trans i18nKey="notificationScopeAll" defaults="All" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function NotificationsPage() {
  const [preferences] = trpc.user.getNotificationPreferences.useSuspenseQuery();
  const updatePreferences =
    trpc.user.updateNotificationPreferences.useMutation();

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
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-sm">
                <Trans i18nKey="notifyNewResponse" defaults="New response" />
              </span>
              <NotificationScopeTabs
                value={preferences["poll.response.submitted"]}
                onValueChange={(scope) => {
                  updatePreferences.mutate([
                    { eventType: "poll.response.submitted", scope },
                  ]);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-sm">
                <Trans i18nKey="notifyNewComment" defaults="New comment" />
              </span>
              <NotificationScopeTabs
                value={preferences["poll.comment.added"]}
                onValueChange={(scope) => {
                  updatePreferences.mutate([
                    { eventType: "poll.comment.added", scope },
                  ]);
                }}
              />
            </div>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}
