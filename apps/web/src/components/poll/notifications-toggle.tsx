import { trpc } from "@rallly/backend";
import { BellCrossedIcon, BellIcon } from "@rallly/icons";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { Button } from "@/components/button";
import { Trans } from "@/components/trans";
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
      <Button
        data-testid="notifications-toggle"
        disabled={poll.demo || user.isGuest}
        onClick={async () => {
          // toggle
          if (isWatching) {
            await unwatch.mutateAsync({ pollId: poll.id });
          } else {
            await watch.mutateAsync({ pollId: poll.id });
          }
        }}
      >
        <span
          className={clsx(
            "m-1 h-2 w-2 rounded-full",
            isWatching
              ? "bg-green-600 ring-2 ring-green-100/50"
              : "bg-gray-400",
          )}
        />
        <span className="hidden sm:inline-block">
          <Trans defaults="Notifications" i18nKey="notifications" />
        </span>
      </Button>
    </Tooltip>
  );
};

export default NotificationsToggle;
