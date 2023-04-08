import { trpc } from "@rallly/backend";
import { BellCrossedIcon, BellIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { useLoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/button";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";
import { usePollByAdmin } from "@/utils/trpc/hooks";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation("app");

  const { data } = usePollByAdmin();
  const watchers = data.watchers ?? [];

  const { user } = useUser();
  const [isWatching, setIsWatching] = React.useState(() =>
    watchers.some(({ userId }) => userId === user.id),
  );

  const posthog = usePostHog();

  const watch = trpc.polls.watch.useMutation({
    onMutate: () => {
      setIsWatching(true);
    },
    onSuccess: () => {
      // TODO (Luke Vella) [2023-04-08]: We should have a separate query for getting watchers
      posthog?.capture("turned notifications on", {
        pollId: poll.id,
        source: "notifications-toggle",
      });
    },
  });

  const unwatch = trpc.polls.unwatch.useMutation({
    onMutate: () => {
      setIsWatching(false);
    },
    onSuccess: () => {
      posthog?.capture("turned notifications off", {
        pollId: poll.id,
        source: "notifications-toggle",
      });
    },
  });

  const { openLoginModal } = useLoginModal();

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
        disabled={poll.demo}
        icon={isWatching ? <BellIcon /> : <BellCrossedIcon />}
        onClick={async () => {
          if (user.isGuest) {
            // ask to log in
            openLoginModal();
          } else {
            // toggle
            if (isWatching) {
              await unwatch.mutateAsync({ pollId: poll.id });
            } else {
              await watch.mutateAsync({ pollId: poll.id });
            }
          }
        }}
      />
    </Tooltip>
  );
};

export default NotificationsToggle;
