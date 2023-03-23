import { useTranslation } from "next-i18next";
import * as React from "react";

import { useLoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/button";
import Bell from "@/components/icons/bell.svg";
import BellCrossed from "@/components/icons/bell-crossed.svg";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc";
import { usePollByAdmin } from "@/utils/trpc/hooks";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation("app");

  const { data } = usePollByAdmin();
  const watchers = data.watchers ?? [];

  const { user } = useUser();
  const isWatching = watchers.some(({ userId }) => userId === user.id);

  const posthog = usePostHog();

  const watch = trpc.polls.watch.useMutation({
    onSuccess: () => {
      posthog?.capture("turned notifications on", {
        pollId: poll.id,
      });
    },
  });

  const unwatch = trpc.polls.unwatch.useMutation({
    onSuccess: () => {
      posthog?.capture("turned notifications off", {
        pollId: poll.id,
      });
    },
  });

  const isUpdating = watch.isLoading || unwatch.isLoading;
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
        loading={isUpdating}
        disabled={poll.demo}
        icon={isWatching ? <Bell /> : <BellCrossed />}
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
