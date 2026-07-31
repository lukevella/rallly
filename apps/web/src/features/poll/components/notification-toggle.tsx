"use client";

import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { BellIcon, BellOffIcon } from "lucide-react";
import { setPollMutedAction } from "@/features/poll/actions";
import { usePoll } from "@/features/poll/client";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { trpc } from "@/trpc/client";

export function NotificationToggle() {
  const poll = usePoll();
  const { user, ownsObject } = useUser();
  const { t } = useTranslation();
  const queryClient = trpc.useUtils();
  const setPollMuted = useSafeAction(setPollMutedAction, {
    onSuccess: ({ data, input }) => {
      if (!data?.ok) {
        return;
      }
      queryClient.polls.get.setData({ urlId: input.pollId }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          muted: input.muted,
        };
      });
      if (input.muted) {
        toast(
          t("notificationToggleMutedToast", {
            defaultValue: "Notifications are off for this poll",
          }),
          {
            icon: <BellOffIcon className="size-4" />,
            action: {
              label: t("undo", { defaultValue: "Undo" }),
              onClick: () => {
                setPollMuted.execute({ pollId: input.pollId, muted: false });
              },
            },
          },
        );
      } else {
        toast(
          t("notificationToggleUnmutedToast", {
            defaultValue: "Notifications are on for this poll",
          }),
          {
            icon: <BellIcon className="size-4" />,
          },
        );
      }
    },
  });

  if (user?.isGuest || !ownsObject(poll)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={poll.muted}
            aria-label={
              poll.muted
                ? t("unmuteNotifications", {
                    defaultValue: "Unmute notifications",
                  })
                : t("muteNotifications", { defaultValue: "Mute notifications" })
            }
            loading={setPollMuted.isExecuting}
            onClick={() => {
              setPollMuted.execute({ pollId: poll.id, muted: !poll.muted });
            }}
          >
            {poll.muted ? <BellOffIcon /> : <BellIcon />}
            <span className="sr-only">
              {poll.muted
                ? t("unmuteNotifications", {
                    defaultValue: "Unmute notifications",
                  })
                : t("muteNotifications", {
                    defaultValue: "Mute notifications",
                  })}
            </span>
          </Button>
        }
      />
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
    </Tooltip>
  );
}
