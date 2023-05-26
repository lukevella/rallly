import { trpc } from "@rallly/backend";
import { BellIcon } from "@rallly/icons";
import { Switch } from "@rallly/ui/switch";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation();

  const { data: watchers = [], refetch } = trpc.polls.getWatchers.useQuery(
    {
      pollId: poll.id,
    },
    {
      staleTime: Infinity,
    },
  );

  const { user } = useUser();

  const isWatching = watchers.some(({ userId }) => userId === user.id);

  const posthog = usePostHog();

  const watch = trpc.polls.watch.useMutation({
    onSuccess: () => {
      // TODO (Luke Vella) [2023-04-08]: We should have a separate query for getting watchers
      posthog?.capture("turned notifications on", {
        pollId: poll.id,
        source: "notifications-toggle",
      });
      refetch();
    },
  });

  const unwatch = trpc.polls.unwatch.useMutation({
    onSuccess: () => {
      posthog?.capture("turned notifications off", {
        pollId: poll.id,
        source: "notifications-toggle",
      });
      refetch();
    },
  });

  return (
    <Tooltip
      content={
        <div className="max-w-md">
          {user.isGuest
            ? t("notificationsGuest")
            : isWatching
            ? t("notificationsOn")
            : t("notificationsOff")}
        </div>
      }
    >
      <Switch
        disabled={poll.demo || user.isGuest}
        data-testid="notifications-toggle"
        checked={isWatching}
        icon={<BellIcon className="h-4 w-4" />}
        onClick={async () => {
          // toggle
          if (isWatching) {
            await unwatch.mutateAsync({ pollId: poll.id });
          } else {
            await watch.mutateAsync({ pollId: poll.id });
          }
        }}
      />
    </Tooltip>
  );
};

export default NotificationsToggle;
