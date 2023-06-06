import { trpc } from "@rallly/backend";
import { BellOffIcon, BellRingIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { useRouter } from "next/router";
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

  const router = useRouter();
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
    <Button
      icon={isWatching ? BellRingIcon : BellOffIcon}
      data-testid="notifications-toggle"
      disabled={poll.demo || user.isGuest}
      className="flex items-center gap-2 px-2.5"
      onClick={async () => {
        if (user.isGuest) {
          // TODO (Luke Vella) [2023-06-06]: Open Login Modal
          router.push("/login");
          return;
        }
        // toggle
        if (isWatching) {
          await unwatch.mutateAsync({ pollId: poll.id });
        } else {
          await watch.mutateAsync({ pollId: poll.id });
        }
      }}
    >
      <span className="hidden font-medium sm:block">
        <Trans i18nKey="notifications" />
      </span>
    </Button>
  );
};

export default NotificationsToggle;
