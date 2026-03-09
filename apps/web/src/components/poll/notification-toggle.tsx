"use client";

import { Button } from "@rallly/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { BellIcon, BellOffIcon } from "lucide-react";

import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function NotificationToggle() {
  const poll = usePoll();
  const { user, ownsObject } = useUser();
  const { t } = useTranslation();
  const queryClient = trpc.useUtils();
  const toggleMuted = trpc.polls.toggleMuted.useMutation({
    onSuccess: (_data, vars) => {
      queryClient.polls.get.setData({ urlId: vars.pollId }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          muted: vars.muted,
        };
      });
    },
  });

  if (user?.isGuest || !ownsObject(poll)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          aria-pressed={poll.muted}
          aria-label={
            poll.muted
              ? t("unmuteNotifications", {
                  defaultValue: "Unmute notifications",
                })
              : t("muteNotifications", { defaultValue: "Mute notifications" })
          }
          onClick={() => {
            toggleMuted.mutate({ pollId: poll.id, muted: !poll.muted });
          }}
        >
          {poll.muted ? <BellOffIcon /> : <BellIcon />}
          <span className="sr-only">
            {poll.muted
              ? t("unmuteNotifications", {
                  defaultValue: "Unmute notifications",
                })
              : t("muteNotifications", { defaultValue: "Mute notifications" })}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>
          {poll.muted ? (
            <Trans
              i18nKey="unmuteNotifications"
              defaults="Unmute notifications"
            />
          ) : (
            <Trans i18nKey="muteNotifications" defaults="Mute notifications" />
          )}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
