import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { BellOffIcon, BellRingIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { usePoll } from "../poll-context";

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const pathname = usePathname();
  const router = useRouter();

  const { data: watchers } = trpc.polls.getWatchers.useQuery(
    {
      pollId: poll.id,
    },
    {
      staleTime: Number.POSITIVE_INFINITY,
    },
  );

  const { user } = useUser();

  const isWatching = watchers?.some(({ userId }) => userId === user?.id);

  const queryClient = trpc.useUtils();

  const watch = trpc.polls.watch.useMutation({
    onSuccess: () => {
      queryClient.polls.getWatchers.setData(
        { pollId: poll.id },
        (oldWatchers) => {
          if (!oldWatchers || !user) {
            return;
          }
          return [...oldWatchers, { userId: user.id }];
        },
      );
    },
  });

  const unwatch = trpc.polls.unwatch.useMutation({
    onSuccess: () => {
      queryClient.polls.getWatchers.setData(
        { pollId: poll.id },
        (oldWatchers) => {
          if (!oldWatchers) {
            return;
          }
          return oldWatchers.filter(({ userId }) => userId !== user?.id);
        },
      );
    },
  });

  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="notifications-toggle"
          variant="ghost"
          onClick={async () => {
            if (!user || user.isGuest) {
              router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
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
          {isWatching ? (
            <Icon>
              <BellRingIcon />
            </Icon>
          ) : (
            <Icon>
              <BellOffIcon />
            </Icon>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {!user || user.isGuest ? (
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
