"use client";

import { Switch } from "@rallly/ui/switch";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
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
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-sm">
                <Trans i18nKey="notifyNewResponse" defaults="New response" />
              </span>
              <Switch
                checked={preferences["poll.response.submitted"]}
                onCheckedChange={(enabled) => {
                  updatePreference.mutate({
                    eventType: "poll.response.submitted",
                    enabled,
                  });
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-sm">
                <Trans i18nKey="notifyNewComment" defaults="New comment" />
              </span>
              <Switch
                checked={preferences["poll.comment.added"]}
                onCheckedChange={(enabled) => {
                  updatePreference.mutate({
                    eventType: "poll.comment.added",
                    enabled,
                  });
                }}
              />
            </div>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}
