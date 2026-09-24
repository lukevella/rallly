"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { BellIcon, BellOffIcon } from "lucide-react";
import { setPollMutedAction } from "@/features/poll/actions";
import { usePoll } from "@/features/poll/client";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";

export function NotificationToggle() {
  const poll = usePoll();
  const { user, ownsObject } = useUser();
  const { t } = useTranslation();
  // The action refreshes the page, which is what flips `poll.muted` in the
  // layout's server props.
  const setPollMuted = useMutation(
    mutationOptions(setPollMutedAction, {
      onSuccess: (data, input) => {
        if (!data.ok) {
          return;
        }
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
                  setPollMuted.mutate({ pollId: input.pollId, muted: false });
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
    }),
  );

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
            loading={setPollMuted.isPending}
            onClick={() => {
              setPollMuted.mutate({ pollId: poll.id, muted: !poll.muted });
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
