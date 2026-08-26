"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import {
  BellIcon,
  BellOffIcon,
  CircleStopIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { reopenPollAction, setPollMutedAction } from "@/features/poll/actions";
import type { PollStatus } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { exportPollDataAction } from "./actions";
import { ClosePollDialog } from "./close-poll-dialog";
import { DeletePollDialog } from "./delete-poll-dialog";
import { DuplicatePollDialog } from "./duplicate-poll-dialog";

export function PollOverflowMenu({
  pollId,
  pollTitle,
  status,
  muted,
  canToggleNotifications,
}: {
  pollId: string;
  pollTitle: string;
  status: PollStatus;
  muted: boolean;
  canToggleNotifications: boolean;
}) {
  const { t } = useTranslation();
  const isFree = useIsFree();
  const closeDialog = useDialog();
  const deleteDialog = useDialog();
  const duplicateDialog = useDialog();

  const setPollMuted = useSafeAction(setPollMutedAction, {
    onSuccess: ({ data, input }) => {
      if (!data?.ok) {
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

  const reopenPoll = useSafeAction(reopenPollAction);

  const exportPollData = useSafeAction(exportPollDataAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        return;
      }
      const blob = new Blob([data.content], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("menu", { defaultValue: "Menu" })}
            />
          }
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canToggleNotifications ? (
            <DropdownMenuItem
              onClick={() => {
                setPollMuted.execute({ pollId, muted: !muted });
              }}
            >
              {muted ? <BellIcon /> : <BellOffIcon />}
              {muted ? (
                <Trans
                  i18nKey="turnOnNotifications"
                  defaults="Turn on notifications"
                />
              ) : (
                <Trans
                  i18nKey="turnOffNotifications"
                  defaults="Turn off notifications"
                />
              )}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={() => {
              if (isFree) {
                showPayWall({
                  from: "manage-poll",
                  action: "duplicate",
                  pollId,
                });
              } else {
                duplicateDialog.trigger();
              }
            }}
          >
            <CopyIcon />
            <Trans i18nKey="duplicate" defaults="Duplicate" />
            {isFree ? <ProBadge /> : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              exportPollData.execute({ pollId });
            }}
          >
            <DownloadIcon />
            <Trans i18nKey="exportToCsv" defaults="Export to CSV" />
          </DropdownMenuItem>
          {status === "open" || status === "closed" ? (
            <>
              <DropdownMenuSeparator />
              {status === "open" ? (
                <DropdownMenuItem
                  onClick={() => {
                    closeDialog.trigger();
                  }}
                >
                  <CircleStopIcon />
                  <Trans i18nKey="closePoll" defaults="Close" />
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    reopenPoll.execute({ pollId });
                  }}
                >
                  <PlayIcon />
                  <Trans i18nKey="reopenPoll" defaults="Reopen poll" />
                </DropdownMenuItem>
              )}
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              deleteDialog.trigger();
            }}
          >
            <TrashIcon />
            <Trans i18nKey="deletePoll" defaults="Delete poll" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ClosePollDialog pollId={pollId} {...closeDialog.dialogProps} />
      <DeletePollDialog pollId={pollId} {...deleteDialog.dialogProps} />
      <DuplicatePollDialog
        pollId={pollId}
        defaultTitle={pollTitle}
        {...duplicateDialog.dialogProps}
      />
    </>
  );
}
