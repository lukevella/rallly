import { BellOffIcon, BellRingIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { signIn } from "next-auth/react";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

import { usePoll } from "../poll-context";

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll } = usePoll();

  const { data: watchers, refetch } = trpc.polls.getWatchers.useQuery(
    {
      pollId: poll.id,
    },
    {
      staleTime: Infinity,
    },
  );

  const { user } = useUser();

  const isWatching = watchers?.some(({ userId }) => userId === user.id);

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

  const { t } = useTranslation();

  if (!watchers) {
    return <Skeleton className="h-9 w-9" />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          loading={watch.isLoading || unwatch.isLoading}
          icon={isWatching ? BellRingIcon : BellOffIcon}
          data-testid="notifications-toggle"
          disabled={poll.demo || user.isGuest}
          className="flex items-center gap-2 px-2.5"
          onClick={async () => {
            if (user.isGuest) {
              signIn();
              return;
            }
            // toggle
            if (isWatching) {
              await unwatch.mutateAsync({ pollId: poll.id });
            } else {
              await watch.mutateAsync({ pollId: poll.id });
            }
          }}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {user.isGuest ? (
          <Trans
            i18nKey="notificationsGuestTooltip"
            defaults="Create an account or login to turn on notifications"
          />
        ) : (
          <Trans
            i18nKey="notificationsValue"
            defaults="Notifications: <b>{value}</b>"
            components={{
              b: <span className="font-semibold" />,
            }}
            values={{
              value: isWatching
                ? t("notificationsOn", {
                    defaultValue: "On",
                  })
                : t("notificationsOff", {
                    defaultValue: "Off",
                  }),
            }}
          />
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default NotificationsToggle;
