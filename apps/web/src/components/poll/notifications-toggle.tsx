import { trpc } from "@rallly/backend";
import { Switch } from "@rallly/ui/switch";
import * as React from "react";

import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";

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

  if (!watchers) {
    return <Skeleton className="h-9 w-32" />;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="notifications-toggle">
        <Trans i18nKey="notifications" />
      </label>
      <Switch
        id="notifications-toggle"
        disabled={poll.demo || user.isGuest}
        data-testid="notifications-toggle"
        checked={isWatching}
        onClick={async () => {
          // toggle
          if (isWatching) {
            await unwatch.mutateAsync({ pollId: poll.id });
          } else {
            await watch.mutateAsync({ pollId: poll.id });
          }
        }}
      />
    </div>
  );
};

export default NotificationsToggle;
